import type {
  BusinessProfile,
  InvoiceRecord,
  LostTimeEntry,
  SubscriptionState,
  TimeRange,
} from '../types/invoice';
import {
  MAX_TRIAL_PDF_EXPORTS,
  PLAY_SUBSCRIPTION_SKU,
  TRIAL_DURATION_DAYS,
} from '../utils/invoiceMath';

const KEYS = {
  BUSINESS: 'cfpro_business_v1',
  INVOICES: 'cfpro_invoices_v1',
  SUBSCRIPTION: 'cfpro_subscription_v1',
  DRAFT: 'cfpro_draft_v1',
};

export interface CalculatorDraft {
  invoiceNumber: string;
  clientName: string;
  clientContact: string;
  concept: string;
  notes: string;
  timeRange: TimeRange;
  lostEntries: LostTimeEntry[];
  hourlyRate: string;
  currencyCode: BusinessProfile['defaultCurrencyCode'];
  hoursPerShift: string;
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessName: 'Servicios Técnicos Vega',
  taxId: 'J0310000123456',
  phone: '+505 8842-1900',
  email: 'facturacion@serviciosvega.com',
  address: 'Managua, Nicaragua',
  defaultCurrencyCode: 'NIO',
  defaultHourlyRate: 250,
  defaultTaxPercent: 0,
};

export const DEFAULT_DRAFT: CalculatorDraft = {
  invoiceNumber: 'FAC-0042',
  clientName: 'Constructora El Roble S.A.',
  clientContact: '+505 8710-4420',
  concept: 'Mantenimiento preventivo y soporte técnico en sitio',
  notes: 'Pago neto contra entrega de factura PDF.',
  timeRange: {
    startDate: '2026-11-13',
    startTime: '08:00',
    endDate: '2026-11-13',
    endTime: '17:30',
  },
  lostEntries: [
    { id: 'lost-seed-1', label: 'Perdida 1', hours: 1.0 },
    { id: 'lost-seed-2', label: 'Perdida 2', hours: 0.5 },
  ],
  hourlyRate: '250.00',
  currencyCode: 'NIO',
  hoursPerShift: '24',
};

export const SEED_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-seed-1',
    invoiceNumber: 'FAC-0041',
    createdAt: '2026-11-11T16:30:00.000Z',
    clientName: 'Distribuidora Pacífico',
    clientContact: 'compras@pacifico.ni',
    concept: 'Reparación de sistema eléctrico industrial',
    notes: 'Incluye pruebas de carga.',
    currency: { code: 'NIO', symbol: 'C$', label: 'Córdoba (C$)' },
    timeRange: {
      startDate: '2026-11-11',
      startTime: '08:00',
      endDate: '2026-11-11',
      endTime: '16:00',
    },
    lostEntries: [{ id: 's1-l1', label: 'Almuerzo', hours: 1.0 }],
    summary: {
      grossHours: 8,
      lostHours: 1,
      netHours: 7,
      hourlyRate: 250,
      subtotal: 1750,
      taxPercent: 0,
      taxAmount: 0,
      total: 1750,
    },
  },
  {
    id: 'inv-seed-2',
    invoiceNumber: 'FAC-0040',
    createdAt: '2026-11-09T18:10:00.000Z',
    clientName: 'Clínica San Lucas',
    clientContact: '+505 2255-8010',
    concept: 'Instalación de red y respaldo energético',
    notes: '',
    currency: { code: 'USD', symbol: '$', label: 'Dólar USD ($)' },
    timeRange: {
      startDate: '2026-11-09',
      startTime: '09:00',
      endDate: '2026-11-09',
      endTime: '18:30',
    },
    lostEntries: [{ id: 's2-l1', label: 'Espera de acceso', hours: 0.5 }],
    summary: {
      grossHours: 9.5,
      lostHours: 0.5,
      netHours: 9,
      hourlyRate: 25,
      subtotal: 225,
      taxPercent: 0,
      taxAmount: 0,
      total: 225,
    },
  },
];

export function createInitialSubscription(): SubscriptionState {
  return {
    trialStartedAt: new Date().toISOString(),
    pdfExportsUsed: 0,
    maxTrialExports: MAX_TRIAL_PDF_EXPORTS,
    trialDaysLength: TRIAL_DURATION_DAYS,
    isSubscribed: false,
    playProductId: PLAY_SUBSCRIPTION_SKU,
    playPurchaseToken: null,
    playOrderId: null,
    subscribedAt: null,
    renewsAt: null,
    billingSource: 'none',
  };
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
}

export function loadBusinessProfile(): BusinessProfile {
  return safeRead<BusinessProfile>(KEYS.BUSINESS, DEFAULT_BUSINESS_PROFILE);
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  safeWrite(KEYS.BUSINESS, profile);
}

export function loadInvoices(): InvoiceRecord[] {
  return safeRead<InvoiceRecord[]>(KEYS.INVOICES, SEED_INVOICES);
}

export function saveInvoices(invoices: InvoiceRecord[]): void {
  safeWrite(KEYS.INVOICES, invoices);
}

export function loadSubscription(): SubscriptionState {
  const existing = safeRead<SubscriptionState | null>(KEYS.SUBSCRIPTION, null);
  if (existing) return existing;
  const fresh = createInitialSubscription();
  safeWrite(KEYS.SUBSCRIPTION, fresh);
  return fresh;
}

export function saveSubscription(sub: SubscriptionState): void {
  safeWrite(KEYS.SUBSCRIPTION, sub);
}

export function loadDraft(): CalculatorDraft {
  const loaded = safeRead<Partial<CalculatorDraft>>(KEYS.DRAFT, DEFAULT_DRAFT);
  return {
    ...DEFAULT_DRAFT,
    ...loaded,
    hoursPerShift: loaded.hoursPerShift || DEFAULT_DRAFT.hoursPerShift,
  };
}

export function saveDraft(draft: CalculatorDraft): void {
  safeWrite(KEYS.DRAFT, draft);
}
