import test from 'node:test';
import assert from 'node:assert/strict';
import { parseVCardContact } from './contactParser';

test('parseVCardContact extracts FN, TEL, EMAIL and ORG from standard vCard', () => {
  const sample = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Sofía Herrera Díaz',
    'TEL;TYPE=CELL:+505 8899-1122',
    'EMAIL;TYPE=INTERNET:sofia.herrera@correo.com',
    'ORG:Torre Corporativa Sur',
    'END:VCARD',
  ].join('\n');

  const parsed = parseVCardContact(sample);
  assert.deepEqual(parsed, {
    name: 'Sofía Herrera Díaz',
    phone: '+505 8899-1122',
    email: 'sofia.herrera@correo.com',
    building: 'Torre Corporativa Sur',
  });
});

test('parseVCardContact falls back to N and ADR when FN and ORG are missing', () => {
  const sample = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Mendoza;Carlos;;;',
    'TEL:88123456',
    'ADR:;;Edificio Central;Managua;;;',
    'END:VCARD',
  ].join('\r\n');

  const parsed = parseVCardContact(sample);
  assert.equal(parsed.name, 'Carlos Mendoza');
  assert.equal(parsed.phone, '88123456');
  assert.equal(parsed.building, 'Edificio Central, Managua');
  assert.equal(parsed.email, '');
});
