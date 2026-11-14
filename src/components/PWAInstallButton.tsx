import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Aplicación instalada en modo independiente.
        </div>
      );
    }
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={
          variant === 'header'
            ? 'inline-flex items-center gap-2 rounded-lg bg-white/15 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
            : 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#28419A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1F347E] transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]'
        }
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS || variant === 'card') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className={
            variant === 'header'
              ? 'inline-flex items-center gap-2 rounded-lg bg-white/15 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
              : 'inline-flex items-center justify-center gap-2 rounded-xl border border-[#28419A] px-4 py-3 text-sm font-semibold text-[#28419A] hover:bg-[#28419A]/5 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]'
          }
        >
          <Smartphone className="w-4 h-4" aria-hidden="true" />
          <span>Instalar en Móvil</span>
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-guide-title"
          >
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <h3 id="pwa-install-guide-title" className="text-lg font-bold text-slate-900">
                  Instalar en Android o iPhone
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Cerrar guía de instalación"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
                <p>
                  <strong className="text-slate-900">En Android (Chrome):</strong> Abre el menú del navegador (⋮) y selecciona <em>Instalar aplicación</em> o <em>Agregar a la pantalla principal</em>.
                </p>
                <p>
                  <strong className="text-slate-900">En iPhone / iPad (Safari):</strong> Toca el botón <em>Compartir</em> en la barra inferior y elige <em>Agregar a inicio</em>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-6 w-full min-h-[44px] rounded-xl bg-[#28419A] py-2.5 text-sm font-semibold text-white hover:bg-[#1F347E] transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
