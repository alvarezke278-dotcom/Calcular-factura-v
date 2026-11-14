import React from 'react';
import type { BusinessProfile, InvoiceRecord } from '../types/invoice';
import {
  formatCurrency,
  formatDateDisplay,
  formatHours,
  formatTime12h,
  formatWorkedTimeInShifts,
} from '../utils/invoiceMath';

interface InvoicePreviewCardProps {
  invoice: InvoiceRecord;
  business: BusinessProfile;
  isTrialVersion: boolean;
}

export const InvoicePreviewCard: React.FC<InvoicePreviewCardProps> = ({
  invoice,
  business,
  isTrialVersion,
}) => {
  const shiftHours = invoice.hoursPerShift || 24;
  const grossShift = formatWorkedTimeInShifts(invoice.summary.grossHours, shiftHours);
  const lostShift = formatWorkedTimeInShifts(invoice.summary.lostHours, shiftHours);
  const netShift = formatWorkedTimeInShifts(invoice.summary.netHours, shiftHours);

  return (
    <article
      aria-label="Vista previa de factura PDF"
      className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Document Cobalt Header */}
      <div className="bg-[#28419A] text-white px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-base truncate">
            {business.businessName || 'Calculadora de Facturas Pro'}
          </h3>
          <p className="text-xs text-white/80 mt-1 truncate">
            {[business.taxId ? `RUC: ${business.taxId}` : '', business.phone]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {business.email && (
            <p className="text-xs text-white/75 truncate">{business.email}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-semibold text-white/80">FACTURA</p>
          <p className="font-mono-num text-sm font-bold">{invoice.invoiceNumber}</p>
          <p className="text-xs text-white/75 mt-0.5 font-mono-num">
            {formatDateDisplay(invoice.createdAt.slice(0, 10))}
          </p>
        </div>
      </div>

      {/* Document Body */}
      <div className="p-5 space-y-4 text-sm">
        {/* Client Block */}
        <div className="rounded-xl bg-[#F4F6FA] px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">Facturar a</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {invoice.clientName || 'Cliente General'}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            {[invoice.clientContact, invoice.concept].filter(Boolean).join(' · ') ||
              'Servicio profesional por horas'}
          </p>
        </div>

        {/* Time Summary */}
        <div>
          <p className="text-xs font-bold text-[#28419A] mb-1.5">
            1. Tiempo Principal
          </p>
          <div className="rounded-xl border border-slate-200 px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-600 space-y-0.5">
              <p>
                Inicio:{' '}
                <span className="font-semibold text-slate-800 font-mono-num">
                  {formatDateDisplay(invoice.timeRange.startDate)}{' '}
                  {formatTime12h(invoice.timeRange.startTime)}
                </span>
              </p>
              <p>
                Fin:{' '}
                <span className="font-semibold text-slate-800 font-mono-num">
                  {formatDateDisplay(invoice.timeRange.endDate)}{' '}
                  {formatTime12h(invoice.timeRange.endTime)}
                </span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs text-slate-500 block">Tiempo Bruto</span>
              <span className="font-mono-num font-bold text-[#28419A]">
                {formatHours(invoice.summary.grossHours)}
              </span>
              <span className="block text-[11px] font-mono-num text-slate-600 mt-0.5">
                {grossShift.formatted}
              </span>
            </div>
          </div>
        </div>

        {/* Lost Hours */}
        <div>
          <p className="text-xs font-bold text-[#28419A] mb-1.5">
            2. Descuento de Horas Perdidas
          </p>
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
            {invoice.lostEntries.length === 0 ? (
              <p className="px-3.5 py-2.5 text-xs text-slate-500">
                Sin horas perdidas registradas.
              </p>
            ) : (
              invoice.lostEntries.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-2 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-slate-700 truncate">{item.label}</p>
                    {item.startDate && item.startTime && item.endDate && item.endTime && (
                      <p className="text-[11px] text-slate-500 font-mono-num truncate">
                        {formatDateDisplay(item.startDate)} {formatTime12h(item.startTime)} →{' '}
                        {formatDateDisplay(item.endDate)} {formatTime12h(item.endTime)}
                      </p>
                    )}
                  </div>
                  <span className="font-mono-num font-semibold text-slate-900 shrink-0">
                    - {formatHours(item.hours)}
                  </span>
                </div>
              ))
            )}
            <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between gap-2 text-xs font-bold text-[#28419A]">
              <span>Total Horas Perdidas</span>
              <div className="text-right font-mono-num">
                <span>{formatHours(invoice.summary.lostHours)}</span>
                <span className="block text-[11px] font-medium text-slate-600">
                  {lostShift.formatted}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-xl border border-[#1E824C]/40 bg-emerald-50/40 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Horas Netas Facturables (decimal)</span>
            <span className="font-mono-num font-bold text-slate-900">
              {formatHours(invoice.summary.netHours)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Tiempo Neto Trabajado (Turnos)</span>
            <span className="font-mono-num font-semibold text-[#28419A] text-right">
              {netShift.formatted}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Tarifa por Hora</span>
            <span className="font-mono-num font-semibold text-slate-900">
              {formatCurrency(invoice.summary.hourlyRate, invoice.currency.symbol)}
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">Total a Cobrar</span>
            <span className="text-base font-extrabold font-mono-num text-[#1E824C]">
              {formatCurrency(invoice.summary.total, invoice.currency.symbol)}
            </span>
          </div>
        </div>

        {invoice.notes.trim() && (
          <p className="text-xs text-slate-500">
            <strong className="text-slate-700">Notas:</strong> {invoice.notes}
          </p>
        )}

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          {isTrialVersion
            ? 'Vista previa · Modo prueba gratuita de 7 días'
            : `Documento oficial · ${business.businessName}`}
        </div>
      </div>
    </article>
  );
};
