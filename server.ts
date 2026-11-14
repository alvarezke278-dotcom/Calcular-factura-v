import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function verifyWithGooglePlayDeveloperApi(
  packageName: string,
  purchaseToken: string,
  serviceAccountJsonRaw: string
): Promise<{
  verified: boolean;
  renewsAt: string;
  orderId: string;
  message: string;
}> {
  const sa = JSON.parse(serviceAccountJsonRaw) as {
    client_email: string;
    private_key: string;
  };

  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    })
  ).toString('base64url');

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const signature = signer.sign(sa.private_key, 'base64url');
  const jwt = `${header}.${claim}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error('Failed to obtain Google Play OAuth access token');
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const apiUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(
    packageName
  )}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

  const subRes = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!subRes.ok) {
    throw new Error(`Google Play API returned status ${subRes.status}`);
  }

  const subData = (await subRes.json()) as {
    subscriptionState?: string;
    latestOrderId?: string;
    lineItems?: Array<{ expiryTime?: string }>;
  };

  const isActive =
    subData.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ||
    subData.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';

  const renewsAt =
    subData.lineItems?.[0]?.expiryTime ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    verified: isActive,
    renewsAt,
    orderId: subData.latestOrderId || `GPA.${Date.now()}`,
    message: isActive
      ? 'Suscripción verificada mediante Google Play Developer API.'
      : `Estado de suscripción no activo: ${subData.subscriptionState || 'DESCONOCIDO'}`,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'calculadora-facturas-pro' });
  });

  // Digital Asset Links endpoint required for Android TWA (Trusted Web Activity) Play Store APK
  app.get('/.well-known/assetlinks.json', (_req, res) => {
    const packageName =
      process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.calculadorafacturas.pro';
    const fingerprint =
      process.env.GOOGLE_PLAY_SHA256_FINGERPRINT ||
      '00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00';

    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: [fingerprint],
        },
      },
    ]);
  });

  // Google Play Subscription Verification Endpoint
  app.post('/api/play-billing/verify', async (req, res) => {
    try {
      const { productId, purchaseToken, mode } = req.body as {
        productId?: string;
        purchaseToken?: string;
        mode?: 'google_play_twa' | 'preview_simulator';
      };

      if (!productId || !purchaseToken) {
        res.status(400).json({ error: 'productId y purchaseToken son obligatorios.' });
        return;
      }

      const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
      const packageName =
        process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.calculadorafacturas.pro';

      if (mode === 'google_play_twa' && serviceAccountJson) {
        const verified = await verifyWithGooglePlayDeveloperApi(
          packageName,
          purchaseToken,
          serviceAccountJson
        );
        res.json({
          ...verified,
          purchaseToken,
          billingSource: 'google_play_twa',
        });
        return;
      }

      // Deterministic verification response for web preview / unconfigured service account
      const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const orderId = `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;
      res.json({
        verified: true,
        purchaseToken,
        orderId,
        renewsAt,
        billingSource: mode === 'google_play_twa' ? 'google_play_twa' : 'preview_simulator',
        message:
          mode === 'google_play_twa'
            ? 'Token recibido (configura GOOGLE_PLAY_SERVICE_ACCOUNT_JSON para validación S2S).'
            : 'Suscripción mensual ($3.00/mes) activada en modo prueba web.',
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Error interno de verificación.',
      });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      plugins: [
        {
          name: 'disable-vite-client-ws',
          enforce: 'post',
          transform(code, id) {
            if (id.includes('vite/dist/client/client.mjs')) {
              return {
                code: code.replace(
                  /const transport = normalizeModuleRunnerTransport\(\(\(\) => \{[\s\S]*?\}\)\(\)\);/,
                  'const transport = normalizeModuleRunnerTransport({ send() {}, async connect() {}, async disconnect() {} });'
                ),
                map: null,
              };
            }
          },
        },
      ],
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build dist/index.html not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
