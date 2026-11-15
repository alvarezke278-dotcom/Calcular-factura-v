import type {
  BillingInput,
  BillingSummary,
  LostTimeEntry,
} from '../types/invoice';

/**
 * Computes duration in decimal hours between start and end date/time strings.
 * Returns { hours, valid, error } where hours is rounded to 4 decimals internally.
 */
export function calculateDurationHours(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string
): { hours: number; valid: boolean; error?: string } {
  if (!startDate || !startTime || !endDate || !endTime) {
    return { hours: 0, valid: false, error: 'Completa la fecha y hora de inicio y fin.' };
  }

  const startMs = Date.parse(`${startDate}T${startTime}:00`);
  const endMs = Date.parse(`${endDate}T${endTime}:00`);

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { hours: 0, valid: false, error: 'Formato de fecha u hora inválido.' };
  }

  if (endMs <= startMs) {
    return {
      hours: 0,
      valid: false,
      error: 'La fecha/hora de fin debe ser posterior a la de inicio.',
    };
  }

  const diffHours = (endMs - startMs) / (1000 * 60 * 60);
  return {
    hours: Math.round(diffHours * 10000) / 10000,
    valid: true,
  };
}

export function sumLostHours(entries: LostTimeEntry[]): number {
  const total = entries.reduce((acc, entry) => {
    const val = Number.isFinite(entry.hours) && entry.hours > 0 ? entry.hours : 0;
    return acc + val;
  }, 0);
  return Math.round(total * 10000) / 10000;
}

export function calculateHourlyRateFromShiftPrice(shiftPriceNio: number): number {
  if (!Number.isFinite(shiftPriceNio) || shiftPriceNio <= 0) return 0;
  return shiftPriceNio / 24;
}

export function calculateBilling(input: BillingInput): BillingSummary {
  const grossHours = Math.max(0, input.grossHours || 0);
  const lostHours = Math.max(0, input.lostHours || 0);
  const netHours = Math.max(0, Math.round((grossHours - lostHours) * 10000) / 10000);
  const hourlyRate = Math.max(0, input.hourlyRate || 0);
  const taxPercent = Math.max(0, Math.min(100, input.taxPercent || 0));

  const subtotal = Math.round(netHours * hourlyRate * 100) / 100;
  const taxAmount = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    grossHours,
    lostHours,
    netHours,
    hourlyRate,
    subtotal,
    taxPercent,
    taxAmount,
    total,
  };
}

export function formatCurrency(amount: number, symbol: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = safe.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${formatted}`;
}

export function formatHours(hours: number): string {
  const safe = Number.isFinite(hours) ? hours : 0;
  return `${safe.toFixed(2)} hrs`;
}

export function formatTime12h(time24: string): string {
  const [hStr, mStr] = (time24 || '00:00').split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDateDisplay(isoDate: string): string {
  const parts = (isoDate || '').split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export interface ShiftBreakdown {
  shifts: number;
  hours: number;
  minutes: number;
  hoursPerShift: number;
  formatted: string;
}

export function formatWorkedTimeInShifts(
  netHours: number,
  hoursPerShift: number = 24
): ShiftBreakdown {
  const safeHours = Number.isFinite(netHours) && netHours > 0 ? netHours : 0;
  const safeShiftHours =
    Number.isFinite(hoursPerShift) && hoursPerShift > 0 ? hoursPerShift : 24;

  const totalMinutes = Math.round(safeHours * 60);
  const shiftMinutes = Math.max(1, Math.round(safeShiftHours * 60));

  const shifts = Math.floor(totalMinutes / shiftMinutes);
  const remainingMinutes = totalMinutes % shiftMinutes;
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  const shiftWord = shifts === 1 ? 'Turno' : 'Turnos';
  const hourWord = hours === 1 ? 'hora' : 'horas';
  const formatted = `${shifts} ${shiftWord} con ${hours} ${hourWord} y ${minutes} min`;

  return {
    shifts,
    hours,
    minutes,
    hoursPerShift: safeShiftHours,
    formatted,
  };
}

export function computeEndDateTimeFromHours(
  startDate: string,
  startTime: string,
  hours: number
): { endDate: string; endTime: string } {
  const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 1;
  const startMs = Date.parse(`${startDate}T${startTime}:00`);
  if (Number.isNaN(startMs)) {
    return { endDate: startDate, endTime: startTime };
  }
  const endDateObj = new Date(startMs + Math.round(safeHours * 60) * 60 * 1000);
  const yyyy = endDateObj.getFullYear();
  const mm = String(endDateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(endDateObj.getDate()).padStart(2, '0');
  const hh = String(endDateObj.getHours()).padStart(2, '0');
  const min = String(endDateObj.getMinutes()).padStart(2, '0');
  return {
    endDate: `${yyyy}-${mm}-${dd}`,
    endTime: `${hh}:${min}`,
  };
}
