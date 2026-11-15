import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDurationHours,
  sumLostHours,
  calculateHourlyRateFromShiftPrice,
  calculateBilling,
  formatCurrency,
  formatTime12h,
  formatDateDisplay,
  formatWorkedTimeInShifts,
  computeEndDateTimeFromHours,
} from './invoiceMath';

test('calculateDurationHours computes mockup default 08:00 AM to 05:30 PM as 9.50 hrs', () => {
  const result = calculateDurationHours('2026-11-13', '08:00', '2026-11-13', '17:30');
  assert.equal(result.valid, true);
  assert.equal(result.hours, 9.5);
});

test('calculateDurationHours supports multi-day shifts and >24 hour lost time intervals', () => {
  const shift = calculateDurationHours('2026-11-13', '22:00', '2026-11-14', '06:30');
  assert.equal(shift.valid, true);
  assert.equal(shift.hours, 8.5);

  const over24hLost = calculateDurationHours('2026-11-13', '08:00', '2026-11-15', '10:30');
  assert.equal(over24hLost.valid, true);
  assert.equal(over24hLost.hours, 50.5);
});

test('calculateDurationHours rejects end time <= start time', () => {
  const result = calculateDurationHours('2026-11-13', '17:30', '2026-11-13', '08:00');
  assert.equal(result.valid, false);
  assert.equal(result.hours, 0);
});

test('sumLostHours and calculateBilling match mockup math (9.50 - 1.50 = 8.00 * 250 = 2000)', () => {
  const lost = sumLostHours([
    { id: '1', label: 'Perdida 1', hours: 1.0 },
    { id: '2', label: 'Perdida 2', hours: 0.5 },
  ]);
  assert.equal(lost, 1.5);

  const summary = calculateBilling({
    grossHours: 9.5,
    lostHours: lost,
    hourlyRate: 250,
    taxPercent: 0,
  });

  assert.equal(summary.netHours, 8);
  assert.equal(summary.subtotal, 2000);
  assert.equal(summary.total, 2000);
  assert.equal(formatCurrency(summary.total, 'C$'), 'C$ 2,000.00');
});

test('calculateBilling clamps netHours at zero when lostHours exceeds grossHours and applies tax cleanly', () => {
  const summary = calculateBilling({
    grossHours: 4,
    lostHours: 5,
    hourlyRate: 100,
    taxPercent: 15,
  });
  assert.equal(summary.netHours, 0);
  assert.equal(summary.total, 0);

  const taxed = calculateBilling({
    grossHours: 10,
    lostHours: 2,
    hourlyRate: 100,
    taxPercent: 15,
  });
  assert.equal(taxed.subtotal, 800);
  assert.equal(taxed.taxAmount, 120);
  assert.equal(taxed.total, 920);
});

test('formatTime12h and formatDateDisplay format Spanish locale display strings', () => {
  assert.equal(formatTime12h('08:00'), '08:00 AM');
  assert.equal(formatTime12h('17:30'), '05:30 PM');
  assert.equal(formatTime12h('00:15'), '12:15 AM');
  assert.equal(formatDateDisplay('2026-11-13'), '13/11/2026');
});

test('formatWorkedTimeInShifts converts decimal net hours into Turnos, horas y min', () => {
  // 12 * 24 + 12.5 = 300.50 hrs -> 12 Turnos con 12 horas y 30 min
  const example = formatWorkedTimeInShifts(300.5, 24);
  assert.equal(example.shifts, 12);
  assert.equal(example.hours, 12);
  assert.equal(example.minutes, 30);
  assert.equal(example.formatted, '12 Turnos con 12 horas y 30 min');

  // 1 singular Turno with 8h shift
  const single = formatWorkedTimeInShifts(9.25, 8);
  assert.equal(single.shifts, 1);
  assert.equal(single.hours, 1);
  assert.equal(single.minutes, 15);
  assert.equal(single.formatted, '1 Turno con 1 hora y 15 min');

  // 1.50 hrs lost -> 0 Turnos con 1 hora y 30 min
  const lostSmall = formatWorkedTimeInShifts(1.5, 24);
  assert.equal(lostSmall.formatted, '0 Turnos con 1 hora y 30 min');

  // 26.50 hrs lost with 24h shift -> 1 Turno con 2 horas y 30 min
  const lostOver24 = formatWorkedTimeInShifts(26.5, 24);
  assert.equal(lostOver24.formatted, '1 Turno con 2 horas y 30 min');

  // Zero hours
  const zero = formatWorkedTimeInShifts(0, 24);
  assert.equal(zero.formatted, '0 Turnos con 0 horas y 0 min');
});

test('computeEndDateTimeFromHours computes matching end date/time across day boundaries', () => {
  assert.deepEqual(computeEndDateTimeFromHours('2026-11-13', '12:00', 1.5), {
    endDate: '2026-11-13',
    endTime: '13:30',
  });
  assert.deepEqual(computeEndDateTimeFromHours('2026-11-13', '22:00', 26.5), {
    endDate: '2026-11-15',
    endTime: '00:30',
  });
});

test('calculateHourlyRateFromShiftPrice divides NIO shift price by 24 and computes Total a pagar', () => {
  // 2400 / 24 = 100/hr * 8 net hrs = 800.00
  const rate1 = calculateHourlyRateFromShiftPrice(2400);
  assert.equal(rate1, 100);
  const res1 = calculateBilling({ grossHours: 9.5, lostHours: 1.5, hourlyRate: rate1, taxPercent: 0 });
  assert.equal(res1.total, 800);

  // 1000 / 24 * 24 = 1000.00 exact without premature rounding drift
  const rate2 = calculateHourlyRateFromShiftPrice(1000);
  const res2 = calculateBilling({ grossHours: 24, lostHours: 0, hourlyRate: rate2, taxPercent: 0 });
  assert.equal(res2.total, 1000);

  // Negative or zero stays 0
  assert.equal(calculateHourlyRateFromShiftPrice(0), 0);
  assert.equal(calculateHourlyRateFromShiftPrice(-500), 0);
});
