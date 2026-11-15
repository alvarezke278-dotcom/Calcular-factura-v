import React, { useState } from 'react';
import {
  Building2,
  Check,
  Download,
  Eye,
  Mail,
  Pencil,
  Phone,
  PlusCircle,
  Save,
  Share2,
  Trash2,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import type {
  BillingSummary,
  ClientRecord,
  LostTimeEntry,
  TimeRange,
} from '../types/invoice';
import {
  calculateDurationHours,
  computeEndDateTimeFromHours,
  formatCurrency,
  formatDateDisplay,
  formatHours,
  formatTime12h,
  formatWorkedTimeInShifts,
} from '../utils/invoiceMath';

interface TimeCalculatorFormProps {
  clients: ClientRecord[];
  clientName: string;
  onChangeClientName: (v: string) => void;
  clientContact: string;
  onChangeClientContact: (v: string) => void;
  clientBuilding: string;
  onChangeClientBuilding: (v: string) => void;
  clientEmail: string;
  onChangeClientEmail: (v: string) => void;
  onCommitClientToDirectory?: () => void;
  shiftPriceNio: string;
  onChangeShiftPriceNio: (v: string) => void;
  timeRange: TimeRange;
  onChangeTimeRange: (next: TimeRange) => void;
  grossHoursResult: { hours: number; valid: boolean; error?: string };
  lostEntries: LostTimeEntry[];
  onAddLostEntry: (entry: LostTimeEntry) => void;
  onUpdateLostEntry: (entry: LostTimeEntry) => void;
  onRemoveLostEntry: (id: string) => void;
  totalLostHours: number;
  summary: BillingSummary;
  isInvoiceSaved: boolean;
  onSaveInvoice: () => void;
  onSaveAndSharePdf: () => void;
  onDownloadPdf: () => void;
  onNewInvoice: () => void;
  onOpenPreview: () => void;
  actionFeedback: string | null;
}

export const TimeCalculatorForm: React.FC<TimeCalculatorFormProps> = ({
  clients,
  clientName,
  onChangeClientName,
  clientContact,
  onChangeClientContact,
  clientBuilding,
  onChangeClientBuilding,
  clientEmail,
  onChangeClientEmail,
  onCommitClientToDirectory,
  shiftPriceNio,
  onChangeShiftPriceNio,
  timeRange,
  onChangeTimeRange,
  grossHoursResult,
  lostEntries,
  onAddLostEntry,
  onUpdateLostEntry,
  onRemoveLostEntry,
  totalLostHours,
  summary,
  isInvoiceSaved,
  onSaveInvoice,
  onSaveAndSharePdf,
  onDownloadPdf,
  onNewInvoice,
  onOpenPreview,
  actionFeedback,
}) => {
  const [lostStartDate, setLostStartDate] = useState(timeRange.startDate);
  const [lostStartTime, setLostStartTime] = useState('12:00');
  const [lostEndDate, setLostEndDate] = useState(timeRange.startDate);
  const [lostEndTime, setLostEndTime] = useState('13:00');
  const LOST_REASON_OPTIONS = ['Por Luz', 'Por Agua', 'Grampon', 'Otros'] as const;
  const [selectedLostReason, setSelectedLostReason] = useState<string>('');
  const [customLostLabel, setCustomLostLabel] = useState('');
  const [lostError, setLostError] = useState<string | null>(null);
  const [showLostForm, setShowLostForm] = useState(false);
  const [editingLostId, setEditingLostId] = useState<string | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);

  const hasClientData = Boolean(
    clientName.trim() ||
      clientContact.trim() ||
      clientBuilding.trim() ||
      clientEmail.trim()
  );

  const matchedClient = clients.find(
    (c) =>
      hasClientData &&
      c.name.trim().toLowerCase() === clientName.trim().toLowerCase() &&
      c.phone.trim() === clientContact.trim() &&
      c.building.trim().toLowerCase() === clientBuilding.trim().toLowerCase() &&
      c.email.trim().toLowerCase() === clientEmail.trim().toLowerCase()
  );

  const handleSelectExistingClient = (selectedId: string) => {
    if (!selectedId) {
      onChangeClientName('');
      onChangeClientContact('');
      onChangeClientBuilding('');
      onChangeClientEmail('');
      return;
    }

    const found = clients.find((c) => c.id === selectedId);
    if (found) {
      onChangeClientName(found.name);
      onChangeClientContact(found.phone);
      onChangeClientBuilding(found.building);
      onChangeClientEmail(found.email);
    }
  };

  const handleClearClient = () => {
    onChangeClientName('');
    onChangeClientContact('');
    onChangeClientBuilding('');
    onChangeClientEmail('');
    setShowClientForm(false);
  };

  const parsedShiftHours = 24;
  const grossShiftBreakdown = formatWorkedTimeInShifts(summary.grossHours, parsedShiftHours);
  const lostShiftBreakdown = formatWorkedTimeInShifts(summary.lostHours, parsedShiftHours);
  const netShiftBreakdown = formatWorkedTimeInShifts(summary.netHours, parsedShiftHours);

  const lostPreviewResult = calculateDurationHours(
    lostStartDate,
    lostStartTime,
    lostEndDate,
    lostEndTime
  );

  const openNewLostForm = () => {
    setLostError(null);
    setEditingLostId(null);
    setLostStartDate(timeRange.startDate);
    setLostStartTime('12:00');
    setLostEndDate(timeRange.startDate);
    setLostEndTime('13:00');
    setSelectedLostReason('');
    setCustomLostLabel('');
    setShowLostForm(true);
  };

  const openEditLostForm = (entry: LostTimeEntry) => {
    setLostError(null);
    setEditingLostId(entry.id);

    const baseStartDate = entry.startDate || timeRange.startDate;
    const baseStartTime = entry.startTime || '12:00';
    const computedEnd =
      entry.endDate && entry.endTime
        ? { endDate: entry.endDate, endTime: entry.endTime }
        : computeEndDateTimeFromHours(baseStartDate, baseStartTime, entry.hours);

    setLostStartDate(baseStartDate);
    setLostStartTime(baseStartTime);
    setLostEndDate(computedEnd.endDate);
    setLostEndTime(computedEnd.endTime);

    const preset = LOST_REASON_OPTIONS.find((opt) => opt === entry.label);
    if (preset && preset !== 'Otros') {
      setSelectedLostReason(preset);
      setCustomLostLabel('');
    } else if (entry.label === 'Otros') {
      setSelectedLostReason('Otros');
      setCustomLostLabel('');
    } else {
      setSelectedLostReason('Otros');
      setCustomLostLabel(entry.label);
    }

    setShowLostForm(true);
  };

  const handleCancelLostForm = () => {
    setLostError(null);
    setEditingLostId(null);
    setSelectedLostReason('');
    setCustomLostLabel('');
    setShowLostForm(false);
  };

  const handleSaveLost = () => {
    setLostError(null);
    const nextIndex = lostEntries.length + 1;
    const resolvedLabel =
      selectedLostReason === 'Otros'
        ? customLostLabel.trim() || 'Otros'
        : selectedLostReason || customLostLabel.trim() || `Perdida ${nextIndex}`;

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

    const entryPayload: LostTimeEntry = {
      id: editingLostId || `lost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: resolvedLabel,
      hours: durationRes.hours,
      startDate: lostStartDate,
      startTime: lostStartTime,
      endDate: lostEndDate,
      endTime: lostEndTime,
    };

    if (editingLostId) {
      onUpdateLostEntry(entryPayload);
    } else {
      onAddLostEntry(entryPayload);
    }

    setEditingLostId(null);
    setSelectedLostReason('');
    setCustomLostLabel('');
    setShowLostForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Cliente (primero) */}
      <section
        aria-labelledby="section-cliente"
        className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2
              id="section-cliente"
              className="text-base sm:text-lg font-bold text-slate-900 font-display"
            >
              Cliente
            </h2>
            <p className="text-xs text-slate-500">
              Agrega los datos del cliente para asociarlos al reporte y PDF
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className="block w-40 sm:w-44">
              <span className="block text-[11px] font-semibold text-slate-600 mb-1">
                Precio de Turno (NIO)
              </span>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-slate-500 pointer-events-none">
                  C$
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  aria-label="Precio de Turno en NIO"
                  data-testid="shift-price-input"
                  value={shiftPriceNio}
                  onChange={(e) => onChangeShiftPriceNio(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-8 pr-2.5 py-2 text-sm font-mono-num font-semibold text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </div>
            </label>

            {!showClientForm && (
              <button
                type="button"
                onClick={() => setShowClientForm(true)}
                className="min-h-[44px] rounded-xl bg-[#28419A] hover:bg-[#1F347E] px-4 py-2 text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Añadir Cliente</span>
              </button>
            )}
          </div>
        </div>

        {showClientForm && (
          <div
            data-testid="client-form"
            className="mt-3 pt-3 border-t border-slate-100 space-y-3"
          >
            <label className="block">
              <span className="block text-xs font-semibold text-slate-700 mb-1">
                Seleccionar cliente existente o registrar uno nuevo
              </span>
              <select
                aria-label="Seleccionar cliente existente"
                data-testid="client-select"
                value={matchedClient?.id || ''}
                onChange={(e) => handleSelectExistingClient(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20 cursor-pointer"
              >
                <option value="">-- Nuevo cliente (registrar datos) --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name || client.phone}
                    {client.building ? ` · ${client.building}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Nombre y apellidos
                </span>
                <input
                  type="text"
                  aria-label="Nombre y apellidos"
                  value={clientName}
                  onChange={(e) => onChangeClientName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza López"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Número de celular
                </span>
                <input
                  type="tel"
                  aria-label="Número de celular"
                  value={clientContact}
                  onChange={(e) => onChangeClientContact(e.target.value)}
                  placeholder="Ej. +505 8812-3456"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono-num text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Edificación
                </span>
                <input
                  type="text"
                  aria-label="Edificación"
                  value={clientBuilding}
                  onChange={(e) => onChangeClientBuilding(e.target.value)}
                  placeholder="Ej. Torre Empresarial Norte"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-slate-600 mb-1">
                  Correo electrónico
                </span>
                <input
                  type="email"
                  aria-label="Correo electrónico"
                  value={clientEmail}
                  onChange={(e) => onChangeClientEmail(e.target.value)}
                  placeholder="Ej. cliente@correo.com"
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {hasClientData ? (
                <button
                  type="button"
                  onClick={handleClearClient}
                  className="min-h-[42px] rounded-xl border border-slate-300 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 px-3.5 py-2 text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Limpiar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClientForm(false)}
                  className="min-h-[42px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>Cancelar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowClientForm(false);
                  if (hasClientData) {
                    onCommitClientToDirectory?.();
                  }
                }}
                className="min-h-[42px] rounded-xl bg-[#1E824C] hover:bg-[#196E40] px-4 py-2 text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Guardar Cliente</span>
              </button>
            </div>
          </div>
        )}

        {!showClientForm && hasClientData && (
          <div
            data-testid="client-summary-card"
            className="mt-3 rounded-xl border border-slate-200 bg-[#F4F6FA] p-3.5 flex items-start justify-between gap-3"
          >
            <div className="min-w-0 space-y-1 text-xs sm:text-sm text-slate-700">
              {clientName.trim() && (
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#28419A] shrink-0" aria-hidden="true" />
                  <span className="truncate">{clientName}</span>
                </p>
              )}
              {clientContact.trim() && (
                <p className="flex items-center gap-1.5 font-mono-num">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{clientContact}</span>
                </p>
              )}
              {clientBuilding.trim() && (
                <p className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{clientBuilding}</span>
                </p>
              )}
              {clientEmail.trim() && (
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                  <span className="truncate">{clientEmail}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowClientForm(true)}
              aria-label="Editar datos del cliente"
              className="min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Editar</span>
            </button>
          </div>
        )}
      </section>

      {/* Tiempo Principal */}
      <section
        aria-labelledby="section-tiempo-principal"
        className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs"
      >
        <h2
          id="section-tiempo-principal"
          className="text-base sm:text-lg font-bold text-slate-900 font-display"
        >
          Tiempo Principal
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

        {/* Detalle de turnos debajo de Tiempo Principal */}
        <div
          data-testid="gross-shift-breakdown"
          className="mt-3 rounded-xl border border-slate-200 bg-[#F4F6FA] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2"
        >
          <span className="text-xs font-semibold text-slate-600">
            Tiempo principal:
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#28419A] font-mono-num">
            {grossShiftBreakdown.formatted}
          </span>
        </div>
      </section>

      {/* Horas Perdidas */}
      <section
        aria-labelledby="section-horas-perdidas"
        className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs"
      >
        <h2
          id="section-horas-perdidas"
          className="text-base sm:text-lg font-bold text-slate-900 font-display"
        >
          Horas Perdidas
        </h2>

        {/* Lista de horas perdidas guardadas y enumeradas encima del botón Añadir Hora perdida */}
        <div className="mt-2.5 divide-y divide-slate-100" data-testid="lost-entries-list">
          {lostEntries.length === 0 ? (
            <p className="py-2 text-center text-xs text-slate-500">
              No hay horas perdidas registradas.
            </p>
          ) : (
            lostEntries.map((entry, index) => {
              const entryShift = formatWorkedTimeInShifts(
                entry.hours,
                parsedShiftHours
              );
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-2 py-2 min-h-[48px]"
                >
                  <div className="min-w-0">
                    <div>
                      <span className="text-sm font-bold font-mono-num text-[#28419A] mr-1">
                        {index + 1}.
                      </span>
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
                    <p className="text-[11px] text-amber-800 font-mono-num truncate">
                      {entryShift.formatted}
                    </p>
                  </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditLostForm(entry)}
                    aria-label={`Editar ${index + 1}. ${entry.label}`}
                    className="min-h-[40px] px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (editingLostId === entry.id) {
                        handleCancelLostForm();
                      }
                      onRemoveLostEntry(entry.id);
                    }}
                    aria-label={`Eliminar ${index + 1}. ${entry.label}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>

        {/* Botón Añadir Hora perdida o formulario de registro/edición */}
        {!showLostForm ? (
          <button
            type="button"
            onClick={openNewLostForm}
            className="mt-2.5 w-full min-h-[44px] rounded-xl border border-[#28419A] bg-white hover:bg-[#28419A]/5 px-4 py-2 text-xs sm:text-sm font-semibold text-[#28419A] flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Añadir Hora perdida</span>
          </button>
        ) : (
          <div
            data-testid="lost-time-form"
            className="mt-3 pt-3 border-t border-slate-100 space-y-2.5"
          >
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

            {/* Motivos rápidos como botones */}
            <div className="space-y-2 pt-0.5">
              <span className="block text-xs font-medium text-slate-600">
                Motivo de hora perdida:
              </span>
              <div
                role="group"
                aria-label="Motivos de hora perdida"
                className="grid grid-cols-2 sm:grid-cols-4 gap-2"
              >
                {LOST_REASON_OPTIONS.map((reason) => {
                  const isSelected = selectedLostReason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setSelectedLostReason((prev) => (prev === reason ? '' : reason))
                      }
                      className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'border-[#28419A] bg-[#28419A] text-white shadow-xs'
                          : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                      }`}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>

              {selectedLostReason === 'Otros' && (
                <label className="block min-w-0">
                  <span className="sr-only">Especificar otro motivo de hora perdida</span>
                  <input
                    type="text"
                    aria-label="Especificar otro motivo"
                    value={customLostLabel}
                    onChange={(e) => setCustomLostLabel(e.target.value)}
                    placeholder="Especifica el motivo (opcional, ej. Falla mecánica)"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
                  />
                </label>
              )}
            </div>

            {lostError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {lostError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelLostForm}
                className="min-h-[42px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>Cancelar</span>
              </button>

              <button
                type="button"
                onClick={handleSaveLost}
                className="min-h-[42px] rounded-xl bg-[#1E824C] hover:bg-[#196E40] px-4 py-2 text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Guardar</span>
              </button>
            </div>
          </div>
        )}

        {/* Detalle de horas perdidas y neto debajo de Horas Perdidas */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1 text-sm">
            <span className="font-bold text-[#28419A]">Total Perdidas:</span>
            <span className="font-bold text-[#28419A] font-mono-num">
              {formatHours(totalLostHours)}
            </span>
          </div>

          <div
            data-testid="lost-shift-breakdown"
            className="rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2 flex flex-wrap items-center justify-between gap-1.5"
          >
            <span className="text-xs font-semibold text-amber-900">
              Equivalencia perdidas:
            </span>
            <span className="text-xs sm:text-sm font-bold text-amber-900 font-mono-num">
              {lostShiftBreakdown.formatted}
            </span>
          </div>
        </div>
      </section>

      {/* Resumen Neto y Acciones de PDF */}
      <section className="rounded-2xl bg-white p-4 border border-slate-200 shadow-xs space-y-3">
        <div
          data-testid="shift-breakdown-text"
          className="rounded-xl border border-[#1E824C]/30 bg-emerald-50/50 px-3.5 py-2.5 space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="block text-xs font-bold text-emerald-950">
                Tiempo Neto
              </span>
              <span className="text-xs font-mono-num font-semibold text-emerald-800">
                {formatHours(summary.netHours)}
              </span>
            </div>
            <span className="text-sm sm:text-base font-extrabold text-[#1E824C] font-mono-num">
              {netShiftBreakdown.formatted}
            </span>
          </div>

          <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="block text-xs font-bold text-emerald-950">
                Total a pagar
              </span>
              <span
                data-testid="hourly-rate-hint"
                className="text-[11px] font-mono-num text-emerald-800"
              >
                {formatCurrency(summary.hourlyRate, 'C$')}/hr ({formatCurrency(Number.parseFloat(shiftPriceNio) || 0, 'C$')} ÷ 24)
              </span>
            </div>
            <span
              data-testid="total-to-pay"
              className="text-lg sm:text-xl font-extrabold text-[#1E824C] font-mono-num"
            >
              {formatCurrency(summary.total, 'C$')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPreview}
          className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Vista Previa</span>
        </button>

        {!isInvoiceSaved ? (
          <button
            type="button"
            data-testid="save-invoice-btn"
            onClick={onSaveInvoice}
            className="w-full min-h-[46px] rounded-xl bg-[#28419A] hover:bg-[#1F347E] px-4 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Guardar factura</span>
          </button>
        ) : (
          <div className="space-y-2.5" data-testid="saved-pdf-actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onSaveAndSharePdf}
                className="min-h-[46px] rounded-xl bg-[#28419A] hover:bg-[#1F347E] px-4 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Compartir PDF</span>
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
              onClick={onNewInvoice}
              className="w-full min-h-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Nueva factura</span>
            </button>
          </div>
        )}

        {actionFeedback && (
          <p
            role="status"
            className="mt-2.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-800 text-center"
          >
            {actionFeedback}
          </p>
        )}
      </section>
    </div>
  );
};
