import React, { useMemo, useState } from 'react';
import { Download, Eye, FileUp, Search, Share2, Trash2, X } from 'lucide-react';
import type { BusinessProfile, InvoiceRecord } from '../types/invoice';
import {
  formatCurrency,
  formatDateDisplay,
  formatHours,
  formatWorkedTimeInShifts,
} from '../utils/invoiceMath';
import { InvoicePreviewCard } from './InvoicePreviewCard';

interface HistoryViewProps {
  invoices: InvoiceRecord[];
  business: BusinessProfile;
  onLoadInvoice: (invoice: InvoiceRecord) => void;
  onSharePdf: (invoice: InvoiceRecord) => void;
  onDownloadPdf: (invoice: InvoiceRecord) => void;
  onDeleteInvoice: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  invoices,
  business,
  onLoadInvoice,
  onSharePdf,
  onDownloadPdf,
  onDeleteInvoice,
}) => {
  const [query, setQuery] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.clientName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.clientBuilding || '').toLowerCase().includes(q) ||
        (inv.clientEmail || '').toLowerCase().includes(q) ||
        inv.clientContact.toLowerCase().includes(q)
    );
  }, [invoices, query]);

  const totalNetHours = useMemo(
    () => invoices.reduce((acc, inv) => acc + inv.summary.netHours, 0),
    [invoices]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-display">
              Historial de Registros
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {invoices.length} registros guardados · {formatHours(totalNetHours)} netas en total
            </p>
          </div>

          <label className="relative block sm:w-72">
            <span className="sr-only">Buscar registro por cliente o edificación</span>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente, edificación o N°..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {invoices.length === 0
              ? 'Aún no has guardado registros.'
              : 'No se encontraron registros con esa búsqueda.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Completa los datos en Facturar y presiona Guardar factura para guardarla aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="history-list">
          {filtered.map((inv) => {
            const shiftSummary = formatWorkedTimeInShifts(
              inv.summary.netHours,
              inv.hoursPerShift || 24
            );
            return (
              <article
                key={inv.id}
                className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono-num font-bold text-[#28419A]">
                      {inv.invoiceNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">
                      {formatDateDisplay(inv.createdAt.slice(0, 10))}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">
                      {formatHours(inv.summary.netHours)} netas
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {inv.clientName || 'Sin cliente asignado'}
                  </h3>

                  {(inv.clientBuilding || inv.clientContact || inv.clientEmail) && (
                    <p className="text-xs text-slate-600 truncate">
                      {[inv.clientBuilding, inv.clientContact, inv.clientEmail]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0">
                  <div className="text-left md:text-right mr-2">
                    <span className="block text-[11px] text-slate-500">
                      {shiftSummary.formatted}
                    </span>
                    <span className="text-sm font-extrabold font-mono-num text-[#1E824C]">
                      {formatCurrency(inv.summary.total, 'C$')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewInvoice(inv)}
                      aria-label={`Vista previa de ${inv.invoiceNumber}`}
                      className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Vista Previa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadInvoice(inv)}
                      aria-label={`Cargar registro ${inv.invoiceNumber} en calculadora`}
                      className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <FileUp className="w-4 h-4" aria-hidden="true" />
                      <span>Cargar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSharePdf(inv)}
                      aria-label={`Compartir PDF de ${inv.invoiceNumber}`}
                      className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#28419A] hover:bg-[#1F347E] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Share2 className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Compartir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownloadPdf(inv)}
                      aria-label={`Descargar PDF de ${inv.invoiceNumber}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteInvoice(inv.id)}
                      aria-label={`Eliminar registro ${inv.invoiceNumber}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {previewInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista previa de factura ${previewInvoice.invoiceNumber}`}
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F4F6FA] p-3 shadow-xl space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-bold text-slate-900">
                Vista Previa · {previewInvoice.invoiceNumber}
              </span>
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                aria-label="Cerrar vista previa"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <InvoicePreviewCard invoice={previewInvoice} business={business} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSharePdf(previewInvoice)}
                className="min-h-[44px] rounded-xl bg-[#28419A] hover:bg-[#1F347E] px-4 py-2 text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Compartir PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onDownloadPdf(previewInvoice)}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
