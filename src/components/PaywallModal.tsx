import React from 'react';
import { Crown, X } from 'lucide-react';
import type { TrialEvaluation } from '../utils/invoiceMath';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  trialEval: TrialEvaluation;
  isPurchasing: boolean;
  onSubscribe: () => void;
  onGoToPlanDetails: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  trialEval,
  isPurchasing,
  onSubscribe,
  onGoToPlanDetails,
}) => {
  if (!isOpen) return null;

  const isExpired = trialEval.tier === 'trial_expired';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#28419A]/10 text-[#28419A] flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="paywall-modal-title" className="text-lg font-bold text-slate-900">
                {isExpired
                  ? 'Tu prueba gratuita de 7 días finalizó'
                  : 'Límite de facturas PDF alcanzado'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suscripción mensual vía Google Play · $3.00 USD / mes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de suscripción"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          {isExpired
            ? 'Los 7 días de prueba gratuita han concluido. Activa tu suscripción mensual en Google Play por $3.00 USD para seguir generando y compartiendo facturas PDF sin límites.'
            : 'Has utilizado tus 5 exportaciones PDF incluidas en la versión gratuita de prueba. Suscríbete por $3.00 USD al mes para desbloquear facturas PDF ilimitadas y respaldo sin marca de prueba.'}
        </p>

        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>· Exportación y envío de facturas PDF ilimitadas</li>
          <li>· Historial completo de clientes y tarifas</li>
          <li>· Facturas limpias con los datos de tu negocio</li>
          <li>· Cancela en cualquier momento desde Google Play</li>
        </ul>

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            disabled={isPurchasing}
            onClick={onSubscribe}
            className="w-full min-h-[48px] rounded-xl bg-[#1E824C] hover:bg-[#196E40] disabled:opacity-60 px-4 py-3 text-sm font-bold text-white transition-colors cursor-pointer"
          >
            {isPurchasing
              ? 'Conectando con Google Play...'
              : 'Suscribirse por $3.00 / mes (Google Play)'}
          </button>

          <button
            type="button"
            onClick={onGoToPlanDetails}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Ver detalles del plan y configuración Play Store
          </button>
        </div>
      </div>
    </div>
  );
};
