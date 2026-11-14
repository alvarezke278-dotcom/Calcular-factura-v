import React, { useState } from 'react';
import { Menu, Settings, X } from 'lucide-react';
import type { AppTab } from '../types/invoice';
import type { TrialEvaluation } from '../utils/invoiceMath';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  trialEval: TrialEvaluation;
  onQuickSharePdf: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  trialEval,
  onQuickSharePdf,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems: { id: AppTab; label: string }[] = [
    { id: 'calculator', label: 'Calculadora' },
    { id: 'history', label: 'Historial' },
    { id: 'subscription', label: 'Suscripción' },
    { id: 'settings', label: 'Configuración' },
  ];

  const handleMobileNav = (tab: AppTab) => {
    onSelectTab(tab);
    setDrawerOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#28419A] text-white shadow-sm">
        {/* Desktop 3-Zone Top Bar */}
        <div className="hidden md:flex max-w-7xl mx-auto items-center justify-between gap-8 px-6 h-16">
          <button
            type="button"
            onClick={() => onSelectTab('calculator')}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer font-display"
          >
            Calculadora de Facturas
          </button>

          <nav className="flex items-center gap-6" aria-label="Navegación principal">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-white border-white'
                      : 'text-white/75 border-transparent hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onQuickSharePdf}
              className="rounded-lg bg-[#1E824C] hover:bg-[#196E40] px-4 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              Compartir Factura PDF
            </button>
          </div>
        </div>

        {/* Mobile Compact App Bar matching reference mockup */}
        <div className="flex md:hidden items-center justify-between px-2 h-[52px]">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú de navegación"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>

          <h1 className="text-base font-bold tracking-tight text-white truncate px-2">
            Calculadora de Facturas
          </h1>

          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            aria-label="Configuración del negocio"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Menú lateral">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[82vw] bg-white h-full shadow-xl flex flex-col">
            <div className="bg-[#28419A] text-white px-5 py-5 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-base">Calculadora de Facturas</p>
                <p className="text-xs text-white/80 mt-1">
                  {trialEval.tier === 'pro_active'
                    ? 'Plan Pro Mensual activo'
                    : trialEval.tier === 'trial_active'
                    ? `Prueba gratuita · ${trialEval.daysRemaining} días restantes`
                    : 'Prueba de 7 días finalizada'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar menú"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMobileNav(item.id)}
                    className={`w-full text-left px-4 min-h-[44px] rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#28419A]/10 text-[#28419A]'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
              Suscripción Google Play · $3.00 / mes
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
