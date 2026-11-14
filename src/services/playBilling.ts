import { PLAY_MONTHLY_PRICE_USD, PLAY_SUBSCRIPTION_SKU } from '../utils/invoiceMath';

export interface DigitalGoodsItemDetails {
  itemId: string;
  title: string;
  description: string;
  price: {
    currency: string;
    value: string;
  };
  type?: 'subs' | 'inapp';
}

export interface DigitalGoodsPurchaseDetails {
  itemId: string;
  purchaseToken: string;
}

export interface DigitalGoodsService {
  getDetails: (itemIds: string[]) => Promise<DigitalGoodsItemDetails[]>;
  listPurchases: () => Promise<DigitalGoodsPurchaseDetails[]>;
  consume?: (purchaseToken: string) => Promise<void>;
}

declare global {
  interface Window {
    getDigitalGoodsService?: (serviceProvider: string) => Promise<DigitalGoodsService>;
  }
}

export const GOOGLE_PLAY_BILLING_PROVIDER = 'https://play.google.com/billing';

export interface PlayBillingCheck {
  isTwaPlayBillingAvailable: boolean;
  productDetails: DigitalGoodsItemDetails;
}

export async function inspectPlayBillingEnvironment(): Promise<PlayBillingCheck> {
  const fallbackDetails: DigitalGoodsItemDetails = {
    itemId: PLAY_SUBSCRIPTION_SKU,
    title: 'Facturas Pro Mensual',
    description: 'Facturas PDF ilimitadas, historial completo y respaldo sin marcas.',
    price: {
      currency: 'USD',
      value: PLAY_MONTHLY_PRICE_USD.toFixed(2),
    },
    type: 'subs',
  };

  if (typeof window !== 'undefined' && typeof window.getDigitalGoodsService === 'function') {
    try {
      const service = await window.getDigitalGoodsService(GOOGLE_PLAY_BILLING_PROVIDER);
      if (service) {
        const details = await service.getDetails([PLAY_SUBSCRIPTION_SKU]);
        return {
          isTwaPlayBillingAvailable: true,
          productDetails: details[0] ?? fallbackDetails,
        };
      }
    } catch {
      // Running in standard browser outside Android TWA Play Store wrapper
    }
  }

  return {
    isTwaPlayBillingAvailable: false,
    productDetails: fallbackDetails,
  };
}

export interface PurchaseVerificationResult {
  verified: boolean;
  purchaseToken: string;
  orderId: string;
  renewsAt: string;
  billingSource: 'google_play_twa' | 'preview_simulator';
  message: string;
}

/**
 * Initiates a Google Play Subscription purchase via PaymentRequest + Digital Goods API
 * when running inside a Play Store TWA APK, or routes through the server-verified
 * preview checkout when running in the web browser.
 */
export async function startPlaySubscriptionPurchase(): Promise<PurchaseVerificationResult> {
  const env = await inspectPlayBillingEnvironment();

  if (env.isTwaPlayBillingAvailable && typeof window.PaymentRequest === 'function') {
    const paymentMethods: PaymentMethodData[] = [
      {
        supportedMethods: GOOGLE_PLAY_BILLING_PROVIDER,
        data: {
          sku: PLAY_SUBSCRIPTION_SKU,
        },
      },
    ];
    const details: PaymentDetailsInit = {
      total: {
        label: env.productDetails.title,
        amount: {
          currency: env.productDetails.price.currency,
          value: env.productDetails.price.value,
        },
      },
    };

    const request = new PaymentRequest(paymentMethods, details);
    const response = await request.show();
    const { purchaseToken } = (response.details || {}) as { purchaseToken?: string };

    if (!purchaseToken) {
      await response.complete('fail');
      throw new Error('Google Play no devolvió un token de compra válido.');
    }

    const verifyRes = await fetch('/api/play-billing/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: PLAY_SUBSCRIPTION_SKU,
        purchaseToken,
        mode: 'google_play_twa',
      }),
    });

    if (!verifyRes.ok) {
      await response.complete('fail');
      throw new Error('Error al verificar la suscripción con Google Play Developer API.');
    }

    const verifiedData = (await verifyRes.json()) as PurchaseVerificationResult;
    await response.complete('success');
    return verifiedData;
  }

  // Standard web / preview mode: verify simulated Play token against our backend endpoint
  const simulatedToken = `gp_sim_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const res = await fetch('/api/play-billing/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId: PLAY_SUBSCRIPTION_SKU,
      purchaseToken: simulatedToken,
      mode: 'preview_simulator',
    }),
  });

  if (!res.ok) {
    throw new Error('No se pudo procesar la verificación de suscripción.');
  }

  return (await res.json()) as PurchaseVerificationResult;
}

export async function restorePlayPurchases(): Promise<PurchaseVerificationResult | null> {
  if (typeof window !== 'undefined' && typeof window.getDigitalGoodsService === 'function') {
    try {
      const service = await window.getDigitalGoodsService(GOOGLE_PLAY_BILLING_PROVIDER);
      if (service) {
        const purchases = await service.listPurchases();
        const activeSub = purchases.find((p) => p.itemId === PLAY_SUBSCRIPTION_SKU);
        if (activeSub) {
          const res = await fetch('/api/play-billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: activeSub.itemId,
              purchaseToken: activeSub.purchaseToken,
              mode: 'google_play_twa',
            }),
          });
          if (res.ok) {
            return (await res.json()) as PurchaseVerificationResult;
          }
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}
