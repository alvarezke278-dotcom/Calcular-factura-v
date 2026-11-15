import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { ClientsView } from './components/ClientsView';
import { HistoryView } from './components/HistoryView';
import { InvoicePreviewCard } from './components/InvoicePreviewCard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SettingsView } from './components/SettingsView';
import { TimeCalculatorForm } from './components/TimeCalculatorForm';
import { TopBar } from './components/TopBar';
import { downloadInvoicePdf, shareInvoicePdf } from './services/pdfGenerator';
import {
  type CalculatorDraft,
  loadBusinessProfile,
  loadClients,
  loadDraft,
  loadInvoices,
  saveBusinessProfile,
  saveClients,
  saveDraft,
  saveInvoices,
} from './services/storage';
import {
  type AppTab,
  type BusinessProfile,
  type ClientRecord,
  CURRENCIES,
  type InvoiceRecord,
  type LostTimeEntry,
} from './types/invoice';
import {
  calculateBilling,
  calculateDurationHours,
  calculateHourlyRateFromShiftPrice,
  sumLostHours,
} from './utils/invoiceMath';

function getDraftSignature(draft: CalculatorDraft): string {
  return JSON.stringify({
    invoiceNumber: draft.invoiceNumber,
    clientName: draft.clientName,
    clientContact: draft.clientContact,
    clientBuilding: draft.clientBuilding,
    clientEmail: draft.clientEmail,
    shiftPriceNio: draft.shiftPriceNio,
    timeRange: draft.timeRange,
    lostEntries: draft.lostEntries,
  });
}

function getNextInvoiceNumber(invoices: InvoiceRecord[], current: string): string {
  const numbers = [current, ...invoices.map((i) => i.invoiceNumber)]
    .map((num) => {
      const match = /(\d+)$/.exec(num || '');
      return match ? Number.parseInt(match[1], 10) : 0;
    })
    .filter((n) => Number.isFinite(n));
  const maxNum = numbers.length > 0 ? Math.max(...numbers) : 42;
  return `REP-${String(maxNum + 1).padStart(4, '0')}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('calculator');
  const [draft, setDraft] = useState<CalculatorDraft>(() => loadDraft());
  const [business, setBusiness] = useState<BusinessProfile>(() =>
    loadBusinessProfile()
  );
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => loadInvoices());
  const [clients, setClients] = useState<ClientRecord[]>(() => loadClients());

  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  useEffect(() => {
    saveBusinessProfile(business);
  }, [business]);

  useEffect(() => {
    saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  const grossHoursResult = useMemo(
    () =>
      calculateDurationHours(
        draft.timeRange.startDate,
        draft.timeRange.startTime,
        draft.timeRange.endDate,
        draft.timeRange.endTime
      ),
    [draft.timeRange]
  );

  const totalLostHours = useMemo(
    () => sumLostHours(draft.lostEntries),
    [draft.lostEntries]
  );

  const parsedShiftPriceNio = useMemo(
    () => Math.max(0, Number.parseFloat(draft.shiftPriceNio) || 0),
    [draft.shiftPriceNio]
  );

  const liveSummary = useMemo(() => {
    const rate = calculateHourlyRateFromShiftPrice(parsedShiftPriceNio);
    return calculateBilling({
      grossHours: grossHoursResult.hours,
      lostHours: totalLostHours,
      hourlyRate: rate,
      taxPercent: 0,
    });
  }, [grossHoursResult.hours, totalLostHours, parsedShiftPriceNio]);

  const activeCurrency = useMemo(
    () => CURRENCIES.find((c) => c.code === draft.currencyCode) || CURRENCIES[0],
    [draft.currencyCode]
  );

  const currentInvoicePreview: InvoiceRecord = useMemo(
    () => ({
      id: `inv-${draft.invoiceNumber}`,
      invoiceNumber: draft.invoiceNumber || 'REP-0001',
      createdAt: new Date().toISOString(),
      clientName: draft.clientName,
      clientContact: draft.clientContact,
      clientBuilding: draft.clientBuilding,
      clientEmail: draft.clientEmail,
      concept: draft.concept,
      notes: draft.notes,
      currency: activeCurrency,
      timeRange: draft.timeRange,
      lostEntries: draft.lostEntries,
      summary: liveSummary,
      hoursPerShift: 24,
      shiftPriceNio: parsedShiftPriceNio,
    }),
    [draft, activeCurrency, liveSummary, parsedShiftPriceNio]
  );

  const currentSignature = useMemo(() => getDraftSignature(draft), [draft]);
  const isInvoiceSaved =
    savedSignature !== null && savedSignature === currentSignature;

  const handleAddLostEntry = (entry: LostTimeEntry) => {
    setDraft((prev) => ({
      ...prev,
      lostEntries: [...prev.lostEntries, entry],
    }));
  };

  const handleUpdateLostEntry = (updated: LostTimeEntry) => {
    setDraft((prev) => ({
      ...prev,
      lostEntries: prev.lostEntries.map((e) => (e.id === updated.id ? updated : e)),
    }));
  };

  const handleRemoveLostEntry = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      lostEntries: prev.lostEntries.filter((e) => e.id !== id),
    }));
  };

  const upsertCurrentInvoiceInHistory = (record: InvoiceRecord) => {
    setInvoices((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.invoiceNumber === record.invoiceNumber
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...record, id: prev[existingIdx].id };
        return copy;
      }
      return [{ ...record, id: `inv-${Date.now()}` }, ...prev];
    });
  };

  const runPdfAction = async (
    targetInvoice: InvoiceRecord,
    mode: 'share' | 'download'
  ) => {
    try {
      let message = '';
      if (mode === 'share') {
        const result = await shareInvoicePdf(targetInvoice, business);
        message =
          result.method === 'web_share'
            ? `Reporte ${result.filename} compartido correctamente.`
            : `PDF descargado (${result.filename}). En Android/móvil se abre el menú para compartir por WhatsApp o correo.`;
      } else {
        const filename = downloadInvoicePdf(targetInvoice, business);
        message = `Reporte PDF guardado como ${filename}.`;
      }

      upsertCurrentInvoiceInHistory(targetInvoice);
      setActionFeedback(message);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setActionFeedback('No se pudo generar el archivo PDF. Inténtalo de nuevo.');
    }
  };

  const upsertClientFromDraft = () => {
    const name = draft.clientName.trim();
    const phone = draft.clientContact.trim();
    const building = draft.clientBuilding.trim();
    const email = draft.clientEmail.trim();
    if (!name && !phone && !building && !email) return;

    setClients((prev) => {
      const idx = prev.findIndex(
        (c) =>
          (name && c.name.toLowerCase() === name.toLowerCase()) ||
          (email && c.email.toLowerCase() === email.toLowerCase()) ||
          (phone && c.phone === phone)
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          name: name || copy[idx].name,
          phone: phone || copy[idx].phone,
          building: building || copy[idx].building,
          email: email || copy[idx].email,
        };
        return copy;
      }
      return [
        {
          id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          phone,
          building,
          email,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  };

  const handleSaveClient = (client: ClientRecord) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = client;
        return copy;
      }
      return [client, ...prev];
    });
  };

  const handleDeleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUseClientInInvoice = (client: ClientRecord) => {
    setDraft((prev) => ({
      ...prev,
      clientName: client.name,
      clientContact: client.phone,
      clientBuilding: client.building,
      clientEmail: client.email,
    }));
    setActiveTab('calculator');
    setActionFeedback(`Cliente ${client.name || client.phone} seleccionado para facturar.`);
  };

  const handleSaveInvoice = () => {
    upsertClientFromDraft();
    upsertCurrentInvoiceInHistory(currentInvoicePreview);
    setSavedSignature(currentSignature);
    setActionFeedback(
      `Factura ${currentInvoicePreview.invoiceNumber} guardada. Ya puedes compartir o descargar el PDF.`
    );
  };

  const handleNewInvoice = () => {
    const nextNumber = getNextInvoiceNumber(invoices, draft.invoiceNumber);
    setDraft((prev) => ({
      ...prev,
      invoiceNumber: nextNumber,
      clientName: '',
      clientContact: '',
      clientBuilding: '',
      clientEmail: '',
      lostEntries: [],
    }));
    setSavedSignature(null);
    setActionFeedback(null);
  };

  const handleLoadInvoice = (inv: InvoiceRecord) => {
    const loadedDraft: CalculatorDraft = {
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName,
      clientContact: inv.clientContact,
      clientBuilding: inv.clientBuilding || '',
      clientEmail: inv.clientEmail || '',
      concept: inv.concept,
      notes: inv.notes,
      timeRange: inv.timeRange,
      lostEntries: inv.lostEntries,
      hourlyRate: inv.summary.hourlyRate.toFixed(2),
      shiftPriceNio: String(
        inv.shiftPriceNio ?? Math.round((inv.summary.hourlyRate || 0) * 24 * 100) / 100
      ),
      currencyCode: inv.currency.code,
      hoursPerShift: String(inv.hoursPerShift || 24),
    };
    setDraft(loadedDraft);
    setSavedSignature(getDraftSignature(loadedDraft));
    setActiveTab('calculator');
    setActionFeedback(`Factura ${inv.invoiceNumber} cargada.`);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const handleSaveBusiness = (next: BusinessProfile) => {
    setBusiness(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA] text-slate-900">
      <TopBar activeTab={activeTab} onSelectTab={setActiveTab} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 pb-20 md:pb-8">

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <TimeCalculatorForm
                clients={clients}
                clientName={draft.clientName}
                onChangeClientName={(v) => setDraft((p) => ({ ...p, clientName: v }))}
                clientContact={draft.clientContact}
                onChangeClientContact={(v) =>
                  setDraft((p) => ({ ...p, clientContact: v }))
                }
                clientBuilding={draft.clientBuilding}
                onChangeClientBuilding={(v) =>
                  setDraft((p) => ({ ...p, clientBuilding: v }))
                }
                clientEmail={draft.clientEmail}
                onChangeClientEmail={(v) =>
                  setDraft((p) => ({ ...p, clientEmail: v }))
                }
                onCommitClientToDirectory={upsertClientFromDraft}
                shiftPriceNio={draft.shiftPriceNio}
                onChangeShiftPriceNio={(shiftPriceNio) =>
                  setDraft((p) => ({ ...p, shiftPriceNio }))
                }
                timeRange={draft.timeRange}
                onChangeTimeRange={(timeRange) =>
                  setDraft((p) => ({ ...p, timeRange }))
                }
                grossHoursResult={grossHoursResult}
                lostEntries={draft.lostEntries}
                onAddLostEntry={handleAddLostEntry}
                onUpdateLostEntry={handleUpdateLostEntry}
                onRemoveLostEntry={handleRemoveLostEntry}
                totalLostHours={totalLostHours}
                summary={liveSummary}
                isInvoiceSaved={isInvoiceSaved}
                onSaveInvoice={handleSaveInvoice}
                onSaveAndSharePdf={() => runPdfAction(currentInvoicePreview, 'share')}
                onDownloadPdf={() => runPdfAction(currentInvoicePreview, 'download')}
                onNewInvoice={handleNewInvoice}
                onOpenPreview={() => setShowPreviewModal(true)}
                actionFeedback={actionFeedback}
              />
            </div>

            <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-20">
              <InvoicePreviewCard
                invoice={currentInvoicePreview}
                business={business}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView
            invoices={invoices}
            business={business}
            onLoadInvoice={handleLoadInvoice}
            onSharePdf={(inv) => runPdfAction(inv, 'share')}
            onDownloadPdf={(inv) => runPdfAction(inv, 'download')}
            onDeleteInvoice={handleDeleteInvoice}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsView
            clients={clients}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
            onUseClientInInvoice={handleUseClientInInvoice}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView profile={business} onSaveProfile={handleSaveBusiness} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      <OfflineIndicator />

      {/* Document Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa del documento PDF"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F4F6FA] p-3 shadow-xl">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-sm font-bold text-slate-900">
                Vista Previa del Documento PDF
              </span>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                aria-label="Cerrar vista previa"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <InvoicePreviewCard
              invoice={currentInvoicePreview}
              business={business}
            />
          </div>
        </div>
      )}
    </div>
  );
}
