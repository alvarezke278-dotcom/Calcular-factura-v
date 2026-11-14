import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDurationHours,
  sumLostHours,
  calculateBilling,
  formatCurrency,
  formatTime12h,
  formatDateDisplay,
  formatWorkedTimeInShifts,
  evaluateSubscription,
  TRIAL_DURATION_DAYS,
  MAX_TRIAL_PDF_EXPORTS,
  PLAY_SUBSCRIPTION_SKU,
} from './invoiceMath';
import type { SubscriptionState } from '../types/invoice';

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

test('evaluateSubscription tracks 7-day trial, export limits, expiration, and Pro unlock', () => {
  const start = Date.parse('2026-11-13T12:00:00.000Z');
  const baseSub: SubscriptionState = {
    trialStartedAt: new Date(start).toISOString(),
    pdfExportsUsed: 2,
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

  // Day 1: 5 days remaining? After 2 days -> 5 days remaining, 3 exports remaining
  const day3 = start + 2 * 24 * 60 * 60 * 1000;
  const activeEval = evaluateSubscription(baseSub, day3, 2);
  assert.equal(activeEval.tier, 'trial_active');
  assert.equal(activeEval.daysRemaining, 5);
  assert.equal(activeEval.exportsRemaining, 3);
  assert.equal(activeEval.canExportPdf, true);

  // Exhausted exports during trial
  const exhaustedExports = evaluateSubscription({ ...baseSub, pdfExportsUsed: 5 }, day3, 2);
  assert.equal(exhaustedExports.tier, 'trial_active');
  assert.equal(exhaustedExports.exportsRemaining, 0);
  assert.equal(exhaustedExports.canExportPdf, false);

  // Expired after 8 days
  const day8 = start + 8 * 24 * 60 * 60 * 1000;
  const expiredEval = evaluateSubscription(baseSub, day8, 2);
  assert.equal(expiredEval.tier, 'trial_expired');
  assert.equal(expiredEval.daysRemaining, 0);
  assert.equal(expiredEval.canExportPdf, false);

  // Subscribed via Google Play overrides trial expiry
  const proEval = evaluateSubscription(
    { ...baseSub, isSubscribed: true, billingSource: 'google_play_twa' },
    day8,
    50
  );
  assert.equal(proEval.tier, 'pro_active');
  assert.equal(proEval.canExportPdf, true);
  assert.equal(proEval.canSaveUnlimited, true);
});
