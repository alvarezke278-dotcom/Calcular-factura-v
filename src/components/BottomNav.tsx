import React from 'react';
import { History, ReceiptText, Settings, Users } from 'lucide-react';
import type { AppTab } from '../types/invoice';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const items: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'calculator', label: 'Facturar', icon: ReceiptText },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200"
    >
      <div className="grid grid-cols-4 h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] transition-colors cursor-pointer ${
                isActive ? 'text-[#28419A]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[11px] font-semibold mt-0.5 leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
