import type {
  BusinessProfile,
  ClientRecord,
  InvoiceRecord,
  LostTimeEntry,
  TimeRange,
} from '../types/invoice';

const KEYS = {
  BUSINESS: 'cfpro_business_v1',
  INVOICES: 'cfpro_invoices_v1',
  CLIENTS: 'cfpro_clients_v1',
  DRAFT: 'cfpro_draft_v1',
};

export interface CalculatorDraft {
  invoiceNumber: string;
  clientName: string;
  clientContact: string;
  clientBuilding: string;
  clientEmail: string;
  concept: string;
  notes: string;
  timeRange: TimeRange;
  lostEntries: LostTimeEntry[];
  hourlyRate: string;
  shiftPriceNio: string;
  currencyCode: BusinessProfile['defaultCurrencyCode'];
  hoursPerShift: string;
}

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  businessName: 'Servicios Técnicos Vega',
  taxId: 'J0310000123456',
  phone: '+505 8842-1900',
  email: 'contacto@serviciosvega.com',
  address: 'Managua, Nicaragua',
  defaultCurrencyCode: 'NIO',
  defaultHourlyRate: 250,
  defaultTaxPercent: 0,
};

export const DEFAULT_DRAFT: CalculatorDraft = {
  invoiceNumber: 'REP-0042',
  clientName: '',
  clientContact: '',
  clientBuilding: '',
  clientEmail: '',
  concept: 'Control de horas trabajadas en sitio',
  notes: '',
  timeRange: {
    startDate: '2026-11-13',
    startTime: '08:00',
    endDate: '2026-11-13',
    endTime: '17:30',
  },
  lostEntries: [
    { id: 'lost-seed-1', label: 'Por Luz', hours: 1.0 },
    { id: 'lost-seed-2', label: 'Por Agua', hours: 0.5 },
  ],
  hourlyRate: '250.00',
  shiftPriceNio: '6000',
  currencyCode: 'NIO',
  hoursPerShift: '24',
};

export const SEED_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-seed-1',
    invoiceNumber: 'REP-0041',
    createdAt: '2026-11-11T16:30:00.000Z',
    clientName: 'Carlos Mendoza López',
    clientContact: '+505 8812-3456',
    clientBuilding: 'Torre Empresarial Norte',
    clientEmail: 'cmendoza@pacifico.ni',
    concept: 'Reparación de sistema eléctrico industrial',
    notes: 'Incluye pruebas de carga.',
    currency: { code: 'NIO', symbol: 'C$', label: 'Córdoba (C$)' },
    timeRange: {
      startDate: '2026-11-11',
      startTime: '08:00',
      endDate: '2026-11-11',
      endTime: '16:00',
    },
    lostEntries: [{ id: 's1-l1', label: 'Por Luz', hours: 1.0 }],
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
    shiftPriceNio: 6000,
  },
  {
    id: 'inv-seed-2',
    invoiceNumber: 'REP-0040',
    createdAt: '2026-11-09T18:10:00.000Z',
    clientName: 'Elena Vargas Ruiz',
    clientContact: '+505 2255-8010',
    clientBuilding: 'Edificio San Lucas',
    clientEmail: 'evargas@sanlucas.com',
    concept: 'Instalación de red y respaldo energético',
    notes: '',
    currency: { code: 'USD', symbol: '$', label: 'Dólar USD ($)' },
    timeRange: {
      startDate: '2026-11-09',
      startTime: '09:00',
      endDate: '2026-11-09',
      endTime: '18:30',
    },
    lostEntries: [{ id: 's2-l1', label: 'Grampon', hours: 0.5 }],
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
    shiftPriceNio: 600,
  },
];

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

export const SEED_CLIENTS: ClientRecord[] = [
  {
    id: 'cli-seed-1',
    name: 'Carlos Mendoza López',
    phone: '+505 8812-3456',
    building: 'Torre Empresarial Norte',
    email: 'cmendoza@pacifico.ni',
    createdAt: '2026-11-11T16:30:00.000Z',
  },
  {
    id: 'cli-seed-2',
    name: 'Elena Vargas Ruiz',
    phone: '+505 2255-8010',
    building: 'Edificio San Lucas',
    email: 'evargas@sanlucas.com',
    createdAt: '2026-11-09T18:10:00.000Z',
  },
];

export function loadClients(): ClientRecord[] {
  return safeRead<ClientRecord[]>(KEYS.CLIENTS, SEED_CLIENTS);
}

export function saveClients(clients: ClientRecord[]): void {
  safeWrite(KEYS.CLIENTS, clients);
}

export function loadDraft(): CalculatorDraft {
  const loaded = safeRead<Partial<CalculatorDraft>>(KEYS.DRAFT, DEFAULT_DRAFT);
  return {
    ...DEFAULT_DRAFT,
    ...loaded,
    clientBuilding: loaded.clientBuilding ?? DEFAULT_DRAFT.clientBuilding,
    clientEmail: loaded.clientEmail ?? DEFAULT_DRAFT.clientEmail,
    shiftPriceNio: loaded.shiftPriceNio ?? DEFAULT_DRAFT.shiftPriceNio,
    hoursPerShift: loaded.hoursPerShift || DEFAULT_DRAFT.hoursPerShift,
  };
}

export function saveDraft(draft: CalculatorDraft): void {
  safeWrite(KEYS.DRAFT, draft);
}
