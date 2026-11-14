import React, { useEffect, useState } from 'react';
import { CheckCircle2, Copy, Crown, RefreshCw, Smartphone } from 'lucide-react';
import type { SubscriptionState } from '../types/invoice';
import {
  formatDateDisplay,
  PLAY_MONTHLY_PRICE_USD,
  PLAY_SUBSCRIPTION_SKU,
  type TrialEvaluation,
} from '../utils/invoiceMath';
import { inspectPlayBillingEnvironment } from '../services/playBilling';

interface SubscriptionPlayViewProps {
  subscription: SubscriptionState;
  trialEval: TrialEvaluation;
  isPurchasing: boolean;
  billingMessage: string | null;
  onSubscribe: () => void;
  onRestorePurchases: () => void;
  onSimulateTrialState: (preset: 'day1' | 'expired' | 'cancel_pro') => void;
}

export const SubscriptionPlayView: React.FC<SubscriptionPlayViewProps> = ({
  subscription,
  trialEval,
  isPurchasing,
  billingMessage,
  onSubscribe,
  onRestorePurchases,
  onSimulateTrialState,
}) => {
  const [isTwaAvailable, setIsTwaAvailable] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  useEffect(() => {
    inspectPlayBillingEnvironment().then((env) => {
      setIsTwaAvailable(env.isTwaPlayBillingAvailable);
    });
  }, []);

  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://tu-dominio.com';

  const bubblewrapInitCmd = `npx @bubblewrap/cli init --manifest=${appOrigin}/manifest.webmanifest`;
  const bubblewrapBuildCmd = `npx @bubblewrap/cli build`;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(id);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const trialProgressPercent =
    trialEval.tier === 'pro_active'
      ? 100
      : Math.min(100, Math.max(0, Math.round((trialEval.daysRemaining / 7) * 100)));

  return (
    <div className="space-y-5">
      {/* Plan Status & Google Play Subscription Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Current Trial / Subscription Status */}
        <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900 font-display">
                Estado de tu Cuenta
              </h2>
              <span className="text-xs font-semibold text-[#28419A]">
                {trialEval.tier === 'pro_active'
                  ? 'Plan Pro Activo'
                  : trialEval.tier === 'trial_active'
                  ? 'Prueba Gratuita (7 días)'
                  : 'Prueba Expirada'}
              </span>
            </div>

            {trialEval.tier === 'pro_active' ? (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>Suscripción Google Play Activa ($3.00 / mes)</span>
                </div>
                <p className="text-xs text-emerald-900/80">
                  SKU: <span className="font-mono-num">{subscription.playProductId}</span>
                  {subscription.playOrderId ? ` · Pedido: ${subscription.playOrderId}` : ''}
                </p>
                {subscription.renewsAt && (
                  <p className="text-xs text-emerald-900/80">
                    Próxima renovación:{' '}
                    <span className="font-mono-num font-semibold">
                      {formatDateDisplay(subscription.renewsAt.slice(0, 10))}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Días de prueba restantes</span>
                  <span className="font-mono-num font-bold text-slate-900">
                    {trialEval.daysRemaining} de {subscription.trialDaysLength} días
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      trialEval.tier === 'trial_expired' ? 'bg-red-500' : 'bg-[#28419A]'
                    }`}
                    style={{ width: `${trialProgressPercent}%` }}
                  />
                </div>

                <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-[#F4F6FA] p-3">
                    <span className="text-slate-500 block">Facturas PDF usadas</span>
                    <span className="font-mono-num text-base font-bold text-slate-900 mt-0.5 block">
                      {subscription.pdfExportsUsed} / {subscription.maxTrialExports}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#F4F6FA] p-3">
                    <span className="text-slate-500 block">Fin de prueba</span>
                    <span className="font-mono-num text-base font-bold text-slate-900 mt-0.5 block">
                      {formatDateDisplay(trialEval.trialEndsAt.slice(0, 10))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Developer / Preview Testing Controls */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Simulador de estados para pruebas (Prueba 7 días / Expirada / Pro):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSimulateTrialState('day1')}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Reiniciar Prueba (7 días)
              </button>
              <button
                type="button"
                onClick={() => onSimulateTrialState('expired')}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Simular Prueba Expirada
              </button>
              {subscription.isSubscribed && (
                <button
                  type="button"
                  onClick={() => onSimulateTrialState('cancel_pro')}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 cursor-pointer"
                >
                  Cancelar Suscripción (Demo)
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Right: $3/month Google Play Subscription Checkout */}
        <section className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-[#28419A] text-white flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Plan Mensual Google Play
                </h2>
                <p className="text-xs text-slate-500">
                  SKU: {PLAY_SUBSCRIPTION_SKU} · Renovación automática mensual
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono-num text-slate-900">
                ${PLAY_MONTHLY_PRICE_USD.toFixed(2)} USD
              </span>
              <span className="text-sm font-medium text-slate-500">/ mes</span>
            </div>

            <p className="mt-1 text-xs font-semibold text-[#1E824C]">
              Incluye 7 días de prueba gratuita antes del primer cobro en Play Store
            </p>

            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>· Exportación ilimitada de facturas en PDF para tus clientes</li>
              <li>· Envío directo a WhatsApp, correo o aplicaciones del teléfono</li>
              <li>· Historial ilimitado de clientes, horas perdidas y tarifas</li>
              <li>· Facturas limpias sin marca de versión gratuita</li>
            </ul>
          </div>

          <div className="mt-6 space-y-2.5">
            {!subscription.isSubscribed && (
              <button
                type="button"
                disabled={isPurchasing}
                onClick={onSubscribe}
                className="w-full min-h-[48px] rounded-xl bg-[#1E824C] hover:bg-[#196E40] disabled:opacity-60 px-5 py-3 text-sm font-bold text-white transition-colors cursor-pointer"
              >
                {isPurchasing
                  ? 'Procesando con Google Play...'
                  : 'Suscribirse por $3.00 / mes con Google Play'}
              </button>
            )}

            <button
              type="button"
              onClick={onRestorePurchases}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Restaurar compras de Google Play</span>
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              {isTwaAvailable
                ? 'API Google Play Digital Goods detectada (modo Android APK / TWA).'
                : 'Ejecutándose en navegador web · Al empaquetar como APK TWA, usará Google Play Billing real automáticamente.'}
            </p>

            {billingMessage && (
              <p
                role="status"
                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-800 text-center"
              >
                {billingMessage}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Play Store APK (TWA) & Google Play Billing Integration Kit */}
      <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#28419A]/10 text-[#28419A] flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              Cómo generar el APK / AAB y publicar en Google Play Store
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Esta aplicación ya incluye Manifiesto PWA, Service Worker offline, Digital Goods API{' '}
              <code className="font-mono text-slate-800">https://play.google.com/billing</code>,
              verificación backend{' '}
              <code className="font-mono text-slate-800">/api/play-billing/verify</code> y{' '}
              <code className="font-mono text-slate-800">/.well-known/assetlinks.json</code>. Sigue
              estos 3 pasos para compilar tu APK/AAB firmado:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="rounded-xl bg-[#F4F6FA] p-4 space-y-2">
            <p className="font-bold text-slate-900">1. Empaquetar con Bubblewrap</p>
            <p className="text-xs text-slate-600">
              Genera el proyecto Android TWA (.aab para Play Store y .apk de prueba) apuntando a la
              URL pública de esta app:
            </p>
            <div className="rounded-lg bg-slate-900 text-slate-100 p-2.5 font-mono text-[11px] break-all whitespace-pre-wrap">
              <code>{bubblewrapInitCmd}</code>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(`${bubblewrapInitCmd} && ${bubblewrapBuildCmd}`, 'bw')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#28419A] hover:underline cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{copiedCommand === 'bw' ? 'Comandos copiados' : 'Copiar comandos Bubblewrap'}</span>
            </button>
          </div>

          <div className="rounded-xl bg-[#F4F6FA] p-4 space-y-2">
            <p className="font-bold text-slate-900">2. Crear Suscripción en Play Console</p>
            <p className="text-xs text-slate-600">
              En Google Play Console &gt; Monetización &gt; Suscripciones, crea el producto con estos
              datos exactos:
            </p>
            <ul className="text-xs text-slate-700 space-y-1 font-mono">
              <li>ID: {PLAY_SUBSCRIPTION_SKU}</li>
              <li>Plan base: Mensual ($3.00 USD)</li>
              <li>Oferta: Prueba gratis 7 días</li>
            </ul>
          </div>

          <div className="rounded-xl bg-[#F4F6FA] p-4 space-y-2">
            <p className="font-bold text-slate-900">3. Conectar API de Verificación</p>
            <p className="text-xs text-slate-600">
              Configura las variables de entorno en el servidor para validar cada compra con Google
              Play Developer API (subscriptionsv2):
            </p>
            <ul className="text-xs text-slate-700 space-y-1 font-mono">
              <li>GOOGLE_PLAY_PACKAGE_NAME</li>
              <li>GOOGLE_PLAY_SHA256_FINGERPRINT</li>
              <li>GOOGLE_PLAY_SERVICE_ACCOUNT_JSON</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
