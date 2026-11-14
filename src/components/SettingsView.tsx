import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { BusinessProfile, CurrencyCode } from '../types/invoice';
import { CURRENCIES } from '../types/invoice';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  profile: BusinessProfile;
  onSaveProfile: (next: BusinessProfile) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, onSaveProfile }) => {
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({ ...form, defaultTaxPercent: 0 });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-8 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">
            Datos de tu Negocio (Encabezado PDF)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Esta información aparecerá automáticamente en cada factura PDF que compartas con tus
            clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="block sm:col-span-2">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Nombre comercial o profesional
            </span>
            <input
              type="text"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              RUC / Cédula / ID Fiscal
            </span>
            <input
              type="text"
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num text-slate-900 focus:border-[#28419A] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Teléfono / WhatsApp
            </span>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num text-slate-900 focus:border-[#28419A] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Correo electrónico
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Ciudad / Dirección
            </span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none"
            />
          </label>
        </div>

        <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Moneda por defecto
            </span>
            <select
              value={form.defaultCurrencyCode}
              onChange={(e) =>
                setForm({ ...form, defaultCurrencyCode: e.target.value as CurrencyCode })
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">
              Tarifa por hora base
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.defaultHourlyRate}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultHourlyRate: Number.parseFloat(e.target.value) || 0,
                })
              }
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num text-slate-900 focus:border-[#28419A] focus:outline-none"
            />
          </label>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="min-h-[46px] rounded-xl bg-[#28419A] hover:bg-[#1F347E] px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer"
          >
            Guardar Configuración
          </button>

          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E824C]">
              <Check className="w-4 h-4" aria-hidden="true" />
              Datos guardados correctamente
            </span>
          )}
        </div>
      </form>

      <aside className="lg:col-span-4 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 font-display">
            Aplicación Móvil (PWA / APK)
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Instala esta aplicación en tu teléfono Android o iPhone para usarla como app nativa
            incluso sin conexión a internet.
          </p>
        </div>

        <PWAInstallButton variant="card" />
      </aside>
    </div>
  );
};
