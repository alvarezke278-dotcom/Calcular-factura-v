export type AppTab = 'calculator' | 'history' | 'clients' | 'settings';

export type CurrencyCode = 'NIO' | 'USD' | 'EUR' | 'MXN' | 'GTQ' | 'HNL';

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  label: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'NIO', symbol: 'C$', label: 'Córdoba (C$)' },
  { code: 'USD', symbol: '$', label: 'Dólar USD ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'MXN', symbol: 'MX$', label: 'Peso MX (MX$)' },
  { code: 'GTQ', symbol: 'Q', label: 'Quetzal (Q)' },
  { code: 'HNL', symbol: 'L', label: 'Lempira (L)' },
];

export interface LostTimeEntry {
  id: string;
  label: string;
  hours: number;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
}

export interface TimeRange {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24h)
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:MM (24h)
}

export interface BillingInput {
  grossHours: number;
  lostHours: number;
  hourlyRate: number;
  taxPercent: number;
}

export interface BillingSummary {
  grossHours: number;
  lostHours: number;
  netHours: number;
  hourlyRate: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  clientName: string;
  clientContact: string;
  clientBuilding?: string;
  clientEmail?: string;
  concept: string;
  notes: string;
  currency: CurrencyOption;
  timeRange: TimeRange;
  lostEntries: LostTimeEntry[];
  summary: BillingSummary;
  hoursPerShift?: number;
  shiftPriceNio?: number;
}

export interface BusinessProfile {
  businessName: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  defaultCurrencyCode: CurrencyCode;
  defaultHourlyRate: number;
  defaultTaxPercent: number;
}

export interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  building: string;
  email: string;
  createdAt: string;
}
