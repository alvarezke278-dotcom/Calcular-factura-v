import React, { useState } from 'react';
import {
  Download,
  Eye,
  PlusCircle,
  Share2,
  Trash2,
} from 'lucide-react';
import type {
  BillingSummary,
  CurrencyCode,
  LostTimeEntry,
  TimeRange,
} from '../types/invoice';
import { CURRENCIES } from '../types/invoice';
import {
  calculateDurationHours,
  formatCurrency,
  formatDateDisplay,
  formatHours,
  formatTime12h,
  formatWorkedTimeInShifts,
} from '../utils/invoiceMath';

interface TimeCalculatorFormProps {
  invoiceNumber: string;
  onChangeInvoiceNumber: (v: string) => void;
  clientName: string;
  onChangeClientName: (v: string) => void;
  clientContact: string;
  onChangeClientContact: (v: string) => void;
  concept: string;
  onChangeConcept: (v: string) => void;
  notes: string;
  onChangeNotes: (v: string) => void;
  timeRange: TimeRange;
  onChangeTimeRange: (next: TimeRange) => void;
  grossHoursResult: { hours: number; valid: boolean; error?: string };
  lostEntries: LostTimeEntry[];
  onAddLostEntry: (entry: LostTimeEntry) => void;
  onRemoveLostEntry: (id: string) => void;
  totalLostHours: number;
  hourlyRate: string;
  onChangeHourlyRate: (v: string) => void;
  currencyCode: CurrencyCode;
  onChangeCurrencyCode: (code: CurrencyCode) => void;
  hoursPerShift: string;
  onChangeHoursPerShift: (v: string) => void;
  summary: BillingSummary;
  hasCalculated: boolean;
  onCalculateInvoice: () => void;
  onSaveAndSharePdf: () => void;
  onDownloadPdf: () => void;
  onOpenMobilePreview: () => void;
  actionFeedback: string | null;
}

export const TimeCalculatorForm: React.FC<TimeCalculatorFormProps> = ({
  invoiceNumber,
  onChangeInvoiceNumber,
  clientName,
  onChangeClientName,
  clientContact,
  onChangeClientContact,
  concept,
  onChangeConcept,
  notes,
  onChangeNotes,
  timeRange,
  onChangeTimeRange,
  grossHoursResult,
  lostEntries,
  onAddLostEntry,
  onRemoveLostEntry,
  totalLostHours,
  hourlyRate,
  onChangeHourlyRate,
  currencyCode,
  onChangeCurrencyCode,
  hoursPerShift,
  onChangeHoursPerShift,
  summary,
  onCalculateInvoice,
  onSaveAndSharePdf,
  onDownloadPdf,
  onOpenMobilePreview,
  actionFeedback,
}) => {
  const [lostMode, setLostMode] = useState<'duration' | 'range'>('range');
  const [lostStartDate, setLostStartDate] = useState(timeRange.startDate);
  const [lostStartTime, setLostStartTime] = useState('12:00');
  const [lostEndDate, setLostEndDate] = useState(timeRange.startDate);
  const [lostEndTime, setLostEndTime] = useState('13:00');
  const [lostDurationHours, setLostDurationHours] = useState('0.50');
  const [lostLabel, setLostLabel] = useState('');
  const [lostError, setLostError] = useState<string | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  const selectedCurrency =
    CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[0];

  const parsedShiftHours = Number.parseFloat(hoursPerShift) || 24;
  const grossShiftBreakdown = formatWorkedTimeInShifts(summary.grossHours, parsedShiftHours);
  const lostShiftBreakdown = formatWorkedTimeInShifts(summary.lostHours, parsedShiftHours);
  const netShiftBreakdown = formatWorkedTimeInShifts(summary.netHours, parsedShiftHours);

  const lostPreviewResult = calculateDurationHours(
    lostStartDate,
    lostStartTime,
    lostEndDate,
    lostEndTime
  );

  const handleAddLost = () => {
    setLostError(null);
    const nextIndex = lostEntries.length + 1;
    const cleanLabel = lostLabel.trim() || `Perdida ${nextIndex}`;

    if (lostMode === 'duration') {
      const parsed = Number.parseFloat(lostDurationHours);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setLostError('Ingresa una cantidad de horas mayor a 0 (ej. 0.50 o 26.00).');
        return;
      }
      onAddLostEntry({
        id: `lost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: cleanLabel,
        hours: Math.round(parsed * 10000) / 10000,
      });
      setLostLabel('');
      return;
    }

    const durationRes = calculateDurationHours(
      lostStartDate,
      lostStartTime,
      lostEndDate,
      lostEndTime
    );
    if (!durationRes.valid) {
      setLostError(
        durationRes.error || 'La fecha y hora de fin deben ser posteriores al inicio.'
      );
      return;
    }

    onAddLostEntry({
      id: `lost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: cleanLabel,
      hours: durationRes.hours,
      startDate: lostStartDate,
      startTime: lostStartTime,
      endDate: lostEndDate,
      endTime: lostEndTime,
    });
    setLostLabel('');
  };

  return (
    <div className="space-y-3">
      {/* 1. Tiempo Principal */}
      <section
        aria-labelledby="section-tiempo-principal"
        className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs"
      >
        <h2
          id="section-tiempo-principal"
          className="text-base sm:text-lg font-bold text-slate-900 font-display"
        >
          1. Tiempo Principal
        </h2>

        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-stretch gap-2.5">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Inicio Row */}
            <div className="grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Inicio</span>
              <label className="block min-w-0">
                <span className="sr-only">Fecha de inicio</span>
                <input
                  type="date"
                  aria-label="Fecha de inicio"
                  value={timeRange.startDate}
                  onChange={(e) =>
                    onChangeTimeRange({ ...timeRange, startDate: e.target.value })
                  }
                  className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>
              <label className="block min-w-0">
                <span className="sr-only">Hora de inicio</span>
                <input
                  type="time"
                  aria-label="Hora de inicio"
                  value={timeRange.startTime}
                  onChange={(e) =>
                    onChangeTimeRange({ ...timeRange, startTime: e.target.value })
                  }
                  className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>
            </div>

            {/* Fin Row */}
            <div className="grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-slate-600">Fin</span>
              <label className="block min-w-0">
                <span className="sr-only">Fecha de fin</span>
                <input
                  type="date"
                  aria-label="Fecha de fin"
                  value={timeRange.endDate}
                  onChange={(e) =>
                    onChangeTimeRange({ ...timeRange, endDate: e.target.value })
                  }
                  className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>
              <label className="block min-w-0">
                <span className="sr-only">Hora de fin</span>
                <input
                  type="time"
                  aria-label="Hora de fin"
                  value={timeRange.endTime}
                  onChange={(e) =>
                    onChangeTimeRange({ ...timeRange, endTime: e.target.value })
                  }
                  className="w-full min-w-0 min-h-[44px] rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>
            </div>
          </div>

          {/* Right Cobalt Total Box */}
          <div
            data-testid="gross-hours-box"
            className="sm:w-32 rounded-xl bg-[#28419A] text-white px-4 py-2.5 flex sm:flex-col items-center justify-between sm:justify-center text-center shrink-0"
          >
            <span className="text-xs font-medium text-white/85">Total:</span>
            <span className="text-base sm:text-lg font-bold font-mono-num mt-0.5 whitespace-nowrap">
              {formatHours(grossHoursResult.hours)}
            </span>
          </div>
        </div>

        {!grossHoursResult.valid && grossHoursResult.error && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-600">
            {grossHoursResult.error}
          </p>
        )}
      </section>

      {/* 2. Horas Perdidas */}
      <section
        aria-labelledby="section-horas-perdidas"
        className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="section-horas-perdidas"
            className="text-base sm:text-lg font-bold text-slate-900 font-display"
          >
            2. Horas Perdidas
          </h2>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setLostMode('range')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                lostMode === 'range'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Horario
            </button>
            <button
              type="button"
              onClick={() => setLostMode('duration')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                lostMode === 'duration'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Por Horas
            </button>
          </div>
        </div>

        <div className="mt-2.5 space-y-2">
          {lostMode === 'range' ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-600">Inicio</span>
                <label className="block min-w-0">
                  <span className="sr-only">Fecha inicio de hora perdida</span>
                  <input
                    type="date"
                    aria-label="Fecha inicio de hora perdida"
                    value={lostStartDate}
                    onChange={(e) => setLostStartDate(e.target.value)}
                    className="w-full min-w-0 min-h-[42px] rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="sr-only">Hora inicio perdida</span>
                  <input
                    type="time"
                    aria-label="Hora inicio perdida"
                    value={lostStartTime}
                    onChange={(e) => setLostStartTime(e.target.value)}
                    className="w-full min-w-0 min-h-[42px] rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                  />
                </label>
              </div>

              <div className="grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-slate-600">Fin</span>
                <label className="block min-w-0">
                  <span className="sr-only">Fecha fin de hora perdida</span>
                  <input
                    type="date"
                    aria-label="Fecha fin de hora perdida"
                    value={lostEndDate}
                    onChange={(e) => setLostEndDate(e.target.value)}
                    className="w-full min-w-0 min-h-[42px] rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="sr-only">Hora fin perdida</span>
                  <input
                    type="time"
                    aria-label="Hora fin perdida"
                    value={lostEndTime}
                    onChange={(e) => setLostEndTime(e.target.value)}
                    className="w-full min-w-0 min-h-[42px] rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Tiempo calculado del motivo (soporta +24 hrs):</span>
                <span
                  data-testid="lost-preview-hours"
                  className={`font-mono-num font-bold ${
                    lostPreviewResult.valid ? 'text-[#28419A]' : 'text-red-600'
                  }`}
                >
                  {lostPreviewResult.valid ? formatHours(lostPreviewResult.hours) : '0.00 hrs'}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block min-w-0">
                <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                  Horas perdidas (decimal)
                </span>
                <input
                  type="number"
                  step="0.25"
                  min="0.05"
                  aria-label="Duración en horas perdidas"
                  value={lostDurationHours}
                  onChange={(e) => setLostDurationHours(e.target.value)}
                  placeholder="Ej. 0.50"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono-num text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>
              <label className="block min-w-0">
                <span className="block text-[11px] font-medium text-slate-500 mb-0.5">
                  Motivo (opcional)
                </span>
                <input
                  type="text"
                  aria-label="Motivo de hora perdida"
                  value={lostLabel}
                  onChange={(e) => setLostLabel(e.target.value)}
                  placeholder="Ej. Almuerzo o pausa"
                  className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            {lostMode === 'range' && (
              <label className="block sm:col-span-7 min-w-0">
                <span className="sr-only">Motivo de hora perdida</span>
                <input
                  type="text"
                  aria-label="Motivo de hora perdida"
                  value={lostLabel}
                  onChange={(e) => setLostLabel(e.target.value)}
                  placeholder="Motivo opcional (ej. Almuerzo)"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#28419A] focus:bg-white focus:outline-none"
                />
              </label>
            )}

            <button
              type="button"
              onClick={handleAddLost}
              className={`${
                lostMode === 'range' ? 'sm:col-span-5' : 'sm:col-span-12'
              } w-full min-h-[44px] rounded-xl border border-[#28419A] bg-white hover:bg-[#28419A]/5 px-3 py-2 text-xs sm:text-sm font-semibold text-[#28419A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap`}
            >
              <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Agregar Tiempo Perdido</span>
            </button>
          </div>

          {lostError && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {lostError}
            </p>
          )}
        </div>

        {/* List of Lost Time Entries */}
        <div className="mt-2 divide-y divide-slate-100" data-testid="lost-entries-list">
          {lostEntries.length === 0 ? (
            <p className="py-2 text-center text-xs text-slate-500">
              No hay horas perdidas descontadas.
            </p>
          ) : (
            lostEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 py-1.5 min-h-[44px]"
              >
                <div className="min-w-0">
                  <div>
                    <span className="text-sm font-medium text-slate-800">
                      {entry.label}:{' '}
                    </span>
                    <span className="text-sm font-semibold font-mono-num text-slate-900">
                      {formatHours(entry.hours)}
                    </span>
                  </div>
                  {entry.startDate && entry.startTime && entry.endDate && entry.endTime && (
                    <p className="text-[11px] text-slate-500 font-mono-num truncate">
                      {formatDateDisplay(entry.startDate)} {formatTime12h(entry.startTime)} →{' '}
                      {formatDateDisplay(entry.endDate)} {formatTime12h(entry.endTime)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLostEntry(entry.id)}
                  aria-label={`Eliminar ${entry.label}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-1.5 pt-2 border-t border-slate-200 text-center">
          <span className="text-sm font-bold text-[#28419A] font-mono-num">
            Total Perdidas: {formatHours(totalLostHours)}
          </span>
        </div>
      </section>

      {/* 3. Facturación */}
      <section
        aria-labelledby="section-facturacion"
        className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200 shadow-xs"
      >
        <div className="flex items-center justify-between gap-2">
          <h2
            id="section-facturacion"
            className="text-base sm:text-lg font-bold text-slate-900 font-display"
          >
            3. Facturación
          </h2>
          <button
            type="button"
            onClick={() => setShowClientDetails((v) => !v)}
            className="text-xs font-semibold text-[#28419A] hover:underline cursor-pointer whitespace-nowrap min-h-[36px] px-1"
          >
            {showClientDetails ? 'Ocultar datos cliente' : 'Datos del cliente y N°'}
          </button>
        </div>

        {showClientDetails && (
          <div className="mt-3 pb-3 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Nombre del Cliente
              </span>
              <input
                type="text"
                value={clientName}
                onChange={(e) => onChangeClientName(e.target.value)}
                placeholder="Ej. Constructora El Roble S.A."
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Teléfono o Correo del Cliente
              </span>
              <input
                type="text"
                value={clientContact}
                onChange={(e) => onChangeClientContact(e.target.value)}
                placeholder="Ej. +505 8710-4420"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                N° de Factura
              </span>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => onChangeInvoiceNumber(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-[#28419A] focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Concepto / Servicio
              </span>
              <input
                type="text"
                value={concept}
                onChange={(e) => onChangeConcept(e.target.value)}
                placeholder="Ej. Soporte técnico en sitio"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium text-slate-600 mb-1">
                Notas para la factura PDF
              </span>
              <input
                type="text"
                value={notes}
                onChange={(e) => onChangeNotes(e.target.value)}
                placeholder="Condiciones de pago o aclaraciones"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none"
              />
            </label>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <label className="block sm:col-span-2">
            <span className="block text-xs font-medium text-slate-600 mb-1">
              Tarifa por hora ({selectedCurrency.symbol}):
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              aria-label={`Tarifa por hora (${selectedCurrency.symbol})`}
              value={hourlyRate}
              onChange={(e) => onChangeHourlyRate(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-base font-semibold font-mono-num text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1">Moneda</span>
            <select
              aria-label="Moneda de facturación"
              value={currencyCode}
              onChange={(e) => onChangeCurrencyCode(e.target.value as CurrencyCode)}
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 focus:border-[#28419A] focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} ({c.code})
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onCalculateInvoice}
          className="mt-3.5 w-full min-h-[48px] rounded-xl bg-[#1E824C] hover:bg-[#196E40] active:scale-[0.99] px-5 py-3 text-base font-bold text-white shadow-xs transition-all cursor-pointer"
        >
          Calcular Factura
        </button>

        {/* Emerald Result Box matching Mockup */}
        <div
          data-testid="billing-result-box"
          className="mt-3 rounded-xl border-2 border-[#1E824C] bg-emerald-50/40 px-4 py-3.5 text-center"
        >
          <p className="text-sm sm:text-base font-bold text-slate-900 font-mono-num">
            Horas Netas: {formatHours(summary.netHours)}
          </p>
          <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900 font-mono-num">
            Total a Cobrar: {formatCurrency(summary.total, selectedCurrency.symbol)}
          </p>
        </div>

        {/* Share & PDF Export Actions */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onSaveAndSharePdf}
            className="min-h-[46px] rounded-xl bg-[#28419A] hover:bg-[#1F347E] px-4 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Compartir Factura PDF</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPdf}
            className="min-h-[46px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Descargar PDF</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenMobilePreview}
          className="lg:hidden mt-2 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Ver Vista Previa del Documento PDF</span>
        </button>

        {actionFeedback && (
          <p
            role="status"
            className="mt-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800 text-center"
          >
            {actionFeedback}
          </p>
        )}
      </section>

      {/* 4. Tiempo Trabajado (Sección aparte de horas en decimal) */}
      <section
        aria-labelledby="section-tiempo-turnos"
        className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="section-tiempo-turnos"
              className="text-base sm:text-lg font-bold text-slate-900 font-display"
            >
              4. Tiempo Trabajado (Turnos)
            </h2>
            <p className="text-xs text-slate-500">
              Equivalencia en turnos, horas y minutos para tiempo principal, horas perdidas y neto
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {(['8', '12', '24'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeHoursPerShift(preset)}
                className={`px-2.5 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  String(parsedShiftHours) === preset
                    ? 'bg-[#28419A] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset}h/turno
              </button>
            ))}
            <label className="block w-16">
              <span className="sr-only">Horas por turno personalizadas</span>
              <input
                type="number"
                min="1"
                max="168"
                step="0.5"
                aria-label="Horas por turno"
                value={hoursPerShift}
                onChange={(e) => onChangeHoursPerShift(e.target.value)}
                className="w-full min-h-[36px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-mono-num text-center text-slate-900 focus:border-[#28419A] focus:outline-none"
              />
            </label>
          </div>
        </div>

        <div className="mt-3 space-y-2.5">
          {/* Tiempo Principal (Inicio - Fin) */}
          <div
            data-testid="gross-shift-breakdown"
            className="rounded-xl border border-slate-200 bg-[#F4F6FA] px-3.5 py-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-700">
                Tiempo Principal (Inicio – Fin)
              </span>
              <span className="text-xs font-mono-num font-semibold text-slate-500">
                {formatHours(summary.grossHours)}
              </span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-bold text-[#28419A] font-mono-num">
              {grossShiftBreakdown.formatted}
            </p>
          </div>

          {/* Horas Perdidas */}
          <div
            data-testid="lost-shift-breakdown"
            className="rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-amber-900">
                Horas Perdidas Descontadas
              </span>
              <span className="text-xs font-mono-num font-semibold text-amber-800">
                - {formatHours(summary.lostHours)}
              </span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-bold text-amber-900 font-mono-num">
              {lostShiftBreakdown.formatted}
            </p>
            {lostEntries.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-amber-200/70 space-y-0.5">
                {lostEntries.map((entry) => {
                  const entryShift = formatWorkedTimeInShifts(
                    entry.hours,
                    parsedShiftHours
                  );
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between gap-2 text-[11px] text-amber-900/85"
                    >
                      <span className="truncate">{entry.label}</span>
                      <span className="font-mono-num shrink-0">{entryShift.formatted}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tiempo Neto Trabajado */}
          <div className="rounded-xl border border-[#1E824C]/30 bg-emerald-50/50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
              <span className="text-xs font-bold text-emerald-950">
                Tiempo Neto Trabajado ({netShiftBreakdown.hoursPerShift} hrs/turno)
              </span>
              <span className="text-xs font-mono-num font-semibold text-emerald-800">
                {formatHours(summary.netHours)}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white border border-emerald-200/80 px-2.5 py-2">
                <span className="block text-[11px] font-medium text-slate-500">Turnos</span>
                <span className="text-lg sm:text-xl font-extrabold font-mono-num text-[#1E824C]">
                  {netShiftBreakdown.shifts}
                </span>
              </div>
              <div className="rounded-lg bg-white border border-emerald-200/80 px-2.5 py-2">
                <span className="block text-[11px] font-medium text-slate-500">Horas</span>
                <span className="text-lg sm:text-xl font-extrabold font-mono-num text-slate-900">
                  {netShiftBreakdown.hours}
                </span>
              </div>
              <div className="rounded-lg bg-white border border-emerald-200/80 px-2.5 py-2">
                <span className="block text-[11px] font-medium text-slate-500">Minutos</span>
                <span className="text-lg sm:text-xl font-extrabold font-mono-num text-slate-900">
                  {netShiftBreakdown.minutes}
                </span>
              </div>
            </div>

            <div
              data-testid="shift-breakdown-text"
              className="mt-2.5 rounded-lg bg-white border border-emerald-200 px-3 py-2 text-center"
            >
              <span className="text-sm sm:text-base font-bold text-[#1E824C] font-mono-num">
                {netShiftBreakdown.formatted}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
