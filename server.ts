import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

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
