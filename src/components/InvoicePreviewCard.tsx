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
}

export const InvoicePreviewCard: React.FC<InvoicePreviewCardProps> = ({
  invoice,
  business,
}) => {
  const shiftHours = invoice.hoursPerShift || 24;
  const shiftPriceNio = invoice.shiftPriceNio ?? (invoice.summary.hourlyRate || 0) * 24;
  const grossShift = formatWorkedTimeInShifts(invoice.summary.grossHours, shiftHours);
  const lostShift = formatWorkedTimeInShifts(invoice.summary.lostHours, shiftHours);
  const netShift = formatWorkedTimeInShifts(invoice.summary.netHours, shiftHours);

  return (
    <article
      aria-label="Vista previa del documento PDF"
      className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Document Cobalt Header */}
      <div className="bg-[#28419A] text-white px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display font-bold text-base truncate">
            {business.businessName || 'Control de Tiempo'}
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
          <p className="text-xs font-semibold text-white/80">REPORTE</p>
          <p className="font-mono-num text-sm font-bold">{invoice.invoiceNumber}</p>
          <p className="text-xs text-white/75 mt-0.5 font-mono-num">
            {formatDateDisplay(invoice.createdAt.slice(0, 10))}
          </p>
        </div>
      </div>

      {/* Document Body */}
      <div className="p-5 space-y-4 text-sm">
        {/* Client Block */}
        <div className="rounded-xl bg-[#F4F6FA] px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-slate-500">Cliente</p>
          <p className="text-sm font-bold text-slate-900">
            {invoice.clientName || 'Sin cliente asignado'}
          </p>
          <div className="text-xs text-slate-600 space-y-0.5">
            {invoice.clientContact && (
              <p>
                <span className="font-medium text-slate-500">Celular:</span>{' '}
                <span className="font-mono-num">{invoice.clientContact}</span>
              </p>
            )}
            {invoice.clientBuilding && (
              <p>
                <span className="font-medium text-slate-500">Edificación:</span>{' '}
                {invoice.clientBuilding}
              </p>
            )}
            {invoice.clientEmail && (
              <p>
                <span className="font-medium text-slate-500">Correo:</span>{' '}
                {invoice.clientEmail}
              </p>
            )}
          </div>
        </div>

        {/* Time Summary */}
        <div>
          <p className="text-xs font-bold text-[#28419A] mb-1.5">
            Tiempo Principal
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
            Descuento de Horas Perdidas
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

        {/* Worked Time Totals */}
        <div className="rounded-xl border border-[#1E824C]/40 bg-emerald-50/40 px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Horas Brutas</span>
            <span className="font-mono-num font-semibold text-slate-900">
              {formatHours(invoice.summary.grossHours)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Horas Perdidas Descontadas</span>
            <span className="font-mono-num font-semibold text-amber-800">
              - {formatHours(invoice.summary.lostHours)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Horas Netas Trabajadas (decimal)</span>
            <span className="font-mono-num font-bold text-slate-900">
              {formatHours(invoice.summary.netHours)}
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-200 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900">
              Tiempo Neto
            </span>
            <span className="text-sm font-extrabold font-mono-num text-[#1E824C] text-right">
              {netShift.formatted}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Precio de Turno (NIO)</span>
            <span className="font-mono-num font-semibold text-slate-900">
              {formatCurrency(shiftPriceNio, 'C$')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>Tarifa por Hora (÷ 24)</span>
            <span className="font-mono-num font-semibold text-slate-900">
              {formatCurrency(invoice.summary.hourlyRate, 'C$')}/hr
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-200 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-900">
              Total a pagar
            </span>
            <span className="text-base font-extrabold font-mono-num text-[#1E824C] text-right">
              {formatCurrency(invoice.summary.total, 'C$')}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Documento · {business.businessName || 'Calculadora de Tiempo'}
        </div>
      </div>
    </article>
  );
};
