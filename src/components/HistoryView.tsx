import React, { useMemo, useState } from 'react';
import { Download, FileUp, Search, Share2, Trash2 } from 'lucide-react';
import type { InvoiceRecord } from '../types/invoice';
import { formatCurrency, formatDateDisplay, formatHours } from '../utils/invoiceMath';

interface HistoryViewProps {
  invoices: InvoiceRecord[];
  onLoadInvoice: (invoice: InvoiceRecord) => void;
  onSharePdf: (invoice: InvoiceRecord) => void;
  onDownloadPdf: (invoice: InvoiceRecord) => void;
  onDeleteInvoice: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  invoices,
  onLoadInvoice,
  onSharePdf,
  onDownloadPdf,
  onDeleteInvoice,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.clientName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.concept.toLowerCase().includes(q)
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
              Historial de Facturas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {invoices.length} facturas guardadas · {formatHours(totalNetHours)} facturadas en total
            </p>
          </div>

          <label className="relative block sm:w-72">
            <span className="sr-only">Buscar factura por cliente o número</span>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar cliente o N°..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 focus:border-[#28419A] focus:outline-none focus:ring-2 focus:ring-[#28419A]/20"
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {invoices.length === 0
              ? 'Aún no has guardado facturas.'
              : 'No se encontraron facturas con esa búsqueda.'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Calcula una jornada y presiona Compartir o Descargar PDF para guardarla aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="history-list">
          {filtered.map((inv) => (
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
                  {inv.clientName || 'Cliente General'}
                </h3>

                {inv.concept && (
                  <p className="text-xs text-slate-600 truncate">{inv.concept}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0">
                <div className="text-left md:text-right mr-2">
                  <span className="block text-[11px] text-slate-500">Total cobrado</span>
                  <span className="text-base font-extrabold font-mono-num text-[#1E824C]">
                    {formatCurrency(inv.summary.total, inv.currency.symbol)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onLoadInvoice(inv)}
                    aria-label={`Cargar factura ${inv.invoiceNumber} en calculadora`}
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
                    aria-label={`Eliminar factura ${inv.invoiceNumber}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
