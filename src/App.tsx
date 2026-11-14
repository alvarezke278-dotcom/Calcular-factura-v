import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { HistoryView } from './components/HistoryView';
import { InvoicePreviewCard } from './components/InvoicePreviewCard';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PaywallModal } from './components/PaywallModal';
import { SettingsView } from './components/SettingsView';
import { SubscriptionPlayView } from './components/SubscriptionPlayView';
import { TimeCalculatorForm } from './components/TimeCalculatorForm';
import { TopBar } from './components/TopBar';
import { downloadInvoicePdf, shareInvoicePdf } from './services/pdfGenerator';
import {
  restorePlayPurchases,
  startPlaySubscriptionPurchase,
} from './services/playBilling';
import {
  type CalculatorDraft,
  createInitialSubscription,
  loadBusinessProfile,
  loadDraft,
  loadInvoices,
  loadSubscription,
  saveBusinessProfile,
  saveDraft,
  saveInvoices,
  saveSubscription,
} from './services/storage';
import {
  type AppTab,
  type BusinessProfile,
  CURRENCIES,
  type InvoiceRecord,
  type LostTimeEntry,
  type SubscriptionState,
} from './types/invoice';
import {
  calculateBilling,
  calculateDurationHours,
  evaluateSubscription,
  formatCurrency,
  formatHours,
  sumLostHours,
} from './utils/invoiceMath';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('calculator');
  const [draft, setDraft] = useState<CalculatorDraft>(() => loadDraft());
  const [business, setBusiness] = useState<BusinessProfile>(() =>
    loadBusinessProfile()
  );
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => loadInvoices());
  const [subscription, setSubscription] = useState<SubscriptionState>(() =>
    loadSubscription()
  );

  const [hasCalculated, setHasCalculated] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);

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
    saveSubscription(subscription);
  }, [subscription]);

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

  const liveSummary = useMemo(() => {
    const rate = Number.parseFloat(draft.hourlyRate) || 0;
    return calculateBilling({
      grossHours: grossHoursResult.hours,
      lostHours: totalLostHours,
      hourlyRate: rate,
      taxPercent: 0,
    });
  }, [grossHoursResult.hours, totalLostHours, draft.hourlyRate]);

  const activeCurrency = useMemo(
    () => CURRENCIES.find((c) => c.code === draft.currencyCode) || CURRENCIES[0],
    [draft.currencyCode]
  );

  const currentInvoicePreview: InvoiceRecord = useMemo(
    () => ({
      id: `inv-${draft.invoiceNumber}`,
      invoiceNumber: draft.invoiceNumber || 'FAC-0001',
      createdAt: new Date().toISOString(),
      clientName: draft.clientName,
      clientContact: draft.clientContact,
      concept: draft.concept,
      notes: draft.notes,
      currency: activeCurrency,
      timeRange: draft.timeRange,
      lostEntries: draft.lostEntries,
      summary: liveSummary,
      hoursPerShift: Number.parseFloat(draft.hoursPerShift) || 24,
    }),
    [draft, activeCurrency, liveSummary]
  );

  const trialEval = useMemo(
    () => evaluateSubscription(subscription, Date.now(), invoices.length),
    [subscription, invoices.length]
  );

  const handleAddLostEntry = (entry: LostTimeEntry) => {
    setDraft((prev) => ({
      ...prev,
      lostEntries: [...prev.lostEntries, entry],
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

  const handleCalculateInvoice = () => {
    setHasCalculated(true);
    if (!grossHoursResult.valid) {
      setActionFeedback(
        grossHoursResult.error || 'Revisa el rango de fecha y hora principal.'
      );
      return;
    }
    setActionFeedback(
      `Factura calculada: ${formatHours(liveSummary.netHours)} netas · ${formatCurrency(
        liveSummary.total,
        activeCurrency.symbol
      )}`
    );
  };

  const runGatedPdfAction = async (
    targetInvoice: InvoiceRecord,
    mode: 'share' | 'download'
  ) => {
    if (!trialEval.canExportPdf) {
      setShowPaywall(true);
      return;
    }

    try {
      let message = '';
      if (mode === 'share') {
        const result = await shareInvoicePdf(
          targetInvoice,
          business,
          trialEval.tier !== 'pro_active'
        );
        message =
          result.method === 'web_share'
            ? `Factura ${result.filename} compartida correctamente.`
            : `PDF descargado (${result.filename}). En Android/móvil se abre el menú para compartir por WhatsApp o correo.`;
      } else {
        const filename = downloadInvoicePdf(
          targetInvoice,
          business,
          trialEval.tier !== 'pro_active'
        );
        message = `Factura PDF guardada como ${filename}.`;
      }

      upsertCurrentInvoiceInHistory(targetInvoice);

      if (!subscription.isSubscribed) {
        setSubscription((prev) => ({
          ...prev,
          pdfExportsUsed: prev.pdfExportsUsed + 1,
        }));
      }
      setActionFeedback(message);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setActionFeedback('No se pudo generar el archivo PDF. Inténtalo de nuevo.');
    }
  };

  const handleLoadInvoice = (inv: InvoiceRecord) => {
    setDraft({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName,
      clientContact: inv.clientContact,
      concept: inv.concept,
      notes: inv.notes,
      timeRange: inv.timeRange,
      lostEntries: inv.lostEntries,
      hourlyRate: inv.summary.hourlyRate.toFixed(2),
      currencyCode: inv.currency.code,
      hoursPerShift: String(inv.hoursPerShift || 24),
    });
    setActiveTab('calculator');
    setActionFeedback(`Factura ${inv.invoiceNumber} cargada en la calculadora.`);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const handleSubscribe = async () => {
    setIsPurchasing(true);
    setBillingMessage(null);
    try {
      const result = await startPlaySubscriptionPurchase();
      if (result.verified) {
        setSubscription((prev) => ({
          ...prev,
          isSubscribed: true,
          playPurchaseToken: result.purchaseToken,
          playOrderId: result.orderId,
          subscribedAt: new Date().toISOString(),
          renewsAt: result.renewsAt,
          billingSource: result.billingSource,
        }));
        setBillingMessage(result.message);
        setShowPaywall(false);
        setActionFeedback('Suscripción Pro ($3.00/mes) activada.');
      }
    } catch (err) {
      setBillingMessage(
        err instanceof Error
          ? err.message
          : 'No se pudo completar la suscripción en Google Play.'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setBillingMessage(null);
    const restored = await restorePlayPurchases();
    if (restored && restored.verified) {
      setSubscription((prev) => ({
        ...prev,
        isSubscribed: true,
        playPurchaseToken: restored.purchaseToken,
        playOrderId: restored.orderId,
        renewsAt: restored.renewsAt,
        billingSource: restored.billingSource,
      }));
      setBillingMessage('Suscripción de Google Play restaurada correctamente.');
    } else {
      setBillingMessage(
        'No se encontraron compras activas en Google Play para este dispositivo.'
      );
    }
  };

  const handleSimulateTrialState = (preset: 'day1' | 'expired' | 'cancel_pro') => {
    if (preset === 'day1') {
      setSubscription(createInitialSubscription());
      setBillingMessage('Prueba gratuita reiniciada: 7 días y 5 facturas PDF disponibles.');
      return;
    }
    if (preset === 'expired') {
      const eightDaysAgo = new Date(
        Date.now() - 8 * 24 * 60 * 60 * 1000
      ).toISOString();
      setSubscription({
        ...createInitialSubscription(),
        trialStartedAt: eightDaysAgo,
        pdfExportsUsed: 5,
        isSubscribed: false,
      });
      setBillingMessage('Simulación activada: prueba gratuita de 7 días expirada.');
      return;
    }
    setSubscription((prev) => ({
      ...prev,
      isSubscribed: false,
      playPurchaseToken: null,
      playOrderId: null,
      renewsAt: null,
      billingSource: 'none',
    }));
    setBillingMessage('Suscripción cancelada en modo demo.');
  };

  const handleSaveBusiness = (next: BusinessProfile) => {
    setBusiness(next);
    setDraft((prev) => ({
      ...prev,
      currencyCode: next.defaultCurrencyCode,
      hourlyRate: next.defaultHourlyRate.toFixed(2),
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FA] text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        trialEval={trialEval}
        onQuickSharePdf={() => runGatedPdfAction(currentInvoicePreview, 'share')}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 pb-20 md:pb-8">
        {/* Clean unboxed trial / subscription bar */}
        <div className="mb-3 flex items-center justify-between gap-2 text-xs text-slate-600 px-1">
          <div className="min-w-0 truncate">
            {trialEval.tier === 'pro_active' ? (
              <span>
                <strong className="text-[#1E824C]">Plan Pro Activo</strong> · Google Play
                ($3.00/mes)
              </span>
            ) : trialEval.tier === 'trial_active' ? (
              <span>
                <strong className="text-[#28419A]">Prueba 7 días</strong> ·{' '}
                <span className="font-mono-num">{trialEval.daysRemaining}d</span> rest. ·{' '}
                <span className="font-mono-num">
                  {trialEval.exportsRemaining}/{subscription.maxTrialExports}
                </span>{' '}
                PDF
              </span>
            ) : (
              <span className="text-red-700 font-medium">
                Prueba finalizada · Activa Pro ($3.00/mes)
              </span>
            )}
          </div>

          {trialEval.tier !== 'pro_active' && (
            <button
              type="button"
              onClick={() => setActiveTab('subscription')}
              className="font-semibold text-[#28419A] hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              Activar Pro ($3/mes)
            </button>
          )}
        </div>

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <TimeCalculatorForm
                invoiceNumber={draft.invoiceNumber}
                onChangeInvoiceNumber={(v) =>
                  setDraft((p) => ({ ...p, invoiceNumber: v }))
                }
                clientName={draft.clientName}
                onChangeClientName={(v) => setDraft((p) => ({ ...p, clientName: v }))}
                clientContact={draft.clientContact}
                onChangeClientContact={(v) =>
                  setDraft((p) => ({ ...p, clientContact: v }))
                }
                concept={draft.concept}
                onChangeConcept={(v) => setDraft((p) => ({ ...p, concept: v }))}
                notes={draft.notes}
                onChangeNotes={(v) => setDraft((p) => ({ ...p, notes: v }))}
                timeRange={draft.timeRange}
                onChangeTimeRange={(timeRange) =>
                  setDraft((p) => ({ ...p, timeRange }))
                }
                grossHoursResult={grossHoursResult}
                lostEntries={draft.lostEntries}
                onAddLostEntry={handleAddLostEntry}
                onRemoveLostEntry={handleRemoveLostEntry}
                totalLostHours={totalLostHours}
                hourlyRate={draft.hourlyRate}
                onChangeHourlyRate={(v) => setDraft((p) => ({ ...p, hourlyRate: v }))}
                currencyCode={draft.currencyCode}
                onChangeCurrencyCode={(currencyCode) =>
                  setDraft((p) => ({ ...p, currencyCode }))
                }
                hoursPerShift={draft.hoursPerShift}
                onChangeHoursPerShift={(hoursPerShift) =>
                  setDraft((p) => ({ ...p, hoursPerShift }))
                }
                summary={liveSummary}
                hasCalculated={hasCalculated}
                onCalculateInvoice={handleCalculateInvoice}
                onSaveAndSharePdf={() =>
                  runGatedPdfAction(currentInvoicePreview, 'share')
                }
                onDownloadPdf={() =>
                  runGatedPdfAction(currentInvoicePreview, 'download')
                }
                onOpenMobilePreview={() => setShowMobilePreview(true)}
                actionFeedback={actionFeedback}
              />
            </div>

            <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-20">
              <InvoicePreviewCard
                invoice={currentInvoicePreview}
                business={business}
                isTrialVersion={trialEval.tier !== 'pro_active'}
              />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView
            invoices={invoices}
            onLoadInvoice={handleLoadInvoice}
            onSharePdf={(inv) => runGatedPdfAction(inv, 'share')}
            onDownloadPdf={(inv) => runGatedPdfAction(inv, 'download')}
            onDeleteInvoice={handleDeleteInvoice}
          />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionPlayView
            subscription={subscription}
            trialEval={trialEval}
            isPurchasing={isPurchasing}
            billingMessage={billingMessage}
            onSubscribe={handleSubscribe}
            onRestorePurchases={handleRestorePurchases}
            onSimulateTrialState={handleSimulateTrialState}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView profile={business} onSaveProfile={handleSaveBusiness} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />
      <OfflineIndicator />

      {/* Mobile Invoice Preview Modal */}
      {showMobilePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de factura PDF"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#F4F6FA] p-3 shadow-xl">
            <div className="flex items-center justify-between px-1 pb-2">
              <span className="text-sm font-bold text-slate-900">
                Vista Previa de Factura PDF
              </span>
              <button
                type="button"
                onClick={() => setShowMobilePreview(false)}
                aria-label="Cerrar vista previa"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <InvoicePreviewCard
              invoice={currentInvoicePreview}
              business={business}
              isTrialVersion={trialEval.tier !== 'pro_active'}
            />
          </div>
        </div>
      )}

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        trialEval={trialEval}
        isPurchasing={isPurchasing}
        onSubscribe={handleSubscribe}
        onGoToPlanDetails={() => {
          setShowPaywall(false);
          setActiveTab('subscription');
        }}
      />
    </div>
  );
}
