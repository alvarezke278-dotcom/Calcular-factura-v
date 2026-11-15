export interface ParsedContact {
  name: string;
  phone: string;
  email: string;
  building: string;
}

/**
 * Unfolds vCard line continuations (RFC 2425 / 6350) and extracts
 * basic contact fields (FN/N, TEL, EMAIL, ORG/ADR).
 */
export function parseVCardContact(vcfText: string): ParsedContact {
  const unfolded = vcfText
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '');

  const lines = unfolded.split(/\r?\n/);

  let fn = '';
  let nFallback = '';
  let phone = '';
  let email = '';
  let org = '';
  let adr = '';

  for (const rawLine of lines) {
    const colonIdx = rawLine.indexOf(':');
    if (colonIdx <= 0) continue;

    const keyPart = rawLine.slice(0, colonIdx).toUpperCase();
    const keyName = keyPart.split(';')[0];
    const rawValue = rawLine.slice(colonIdx + 1).trim();
    if (!rawValue) continue;

    const cleanValue = rawValue
      .replace(/\\n/gi, ' ')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .trim();

    if (keyName === 'FN' && !fn) {
      fn = cleanValue;
    } else if (keyName === 'N' && !nFallback) {
      const parts = cleanValue
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        nFallback = `${parts[1]} ${parts[0]}`.trim();
      } else if (parts.length === 1) {
        nFallback = parts[0];
      }
    } else if (keyName === 'TEL' && !phone) {
      phone = cleanValue;
    } else if (keyName === 'EMAIL' && !email) {
      email = cleanValue;
    } else if (keyName === 'ORG' && !org) {
      org = cleanValue.split(';').filter(Boolean).join(' - ').trim();
    } else if (keyName === 'ADR' && !adr) {
      adr = cleanValue
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean)
        .join(', ');
    }
  }

  return {
    name: fn || nFallback,
    phone,
    email,
    building: org || adr,
  };
}
