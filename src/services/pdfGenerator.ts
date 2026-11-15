import { jsPDF } from 'jspdf';
import type { BusinessProfile, InvoiceRecord } from '../types/invoice';
import {
  formatCurrency,
  formatDateDisplay,
  formatHours,
  formatTime12h,
  formatWorkedTimeInShifts,
} from '../utils/invoiceMath';

export function buildInvoicePdfDoc(
  invoice: InvoiceRecord,
  business: BusinessProfile
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // Cobalt Header Banner
  doc.setFillColor(40, 65, 154); // #28419A
  doc.rect(0, 0, pageWidth, 34, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(business.businessName || 'Control de Tiempo', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const businessMeta = [
    business.taxId ? `RUC/ID: ${business.taxId}` : '',
    business.phone ? `Tel: ${business.phone}` : '',
    business.email || '',
  ]
    .filter(Boolean)
    .join('  ·  ');
  if (businessMeta) {
    doc.text(businessMeta, margin, 22);
  }
  if (business.address) {
    doc.text(business.address, margin, 27.5);
  }

  // Document Number & Date on right of header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`REPORTE ${invoice.invoiceNumber}`, pageWidth - margin, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const createdDate = invoice.createdAt.slice(0, 10);
  doc.text(`Fecha: ${formatDateDisplay(createdDate)}`, pageWidth - margin, 22, { align: 'right' });

  y = 44;

  // Client Section
  const clientLines = [
    invoice.clientContact ? `Celular: ${invoice.clientContact}` : '',
    invoice.clientBuilding ? `Edificación: ${invoice.clientBuilding}` : '',
    invoice.clientEmail ? `Correo: ${invoice.clientEmail}` : '',
  ].filter(Boolean);
  const clientBoxHeight = clientLines.length > 1 ? 30 : 24;

  doc.setFillColor(244, 246, 250);
  doc.roundedRect(margin, y, contentWidth, clientBoxHeight, 2, 2, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DEL CLIENTE:', margin + 4, y + 6);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(invoice.clientName || 'Sin cliente asignado', margin + 4, y + 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  if (clientLines.length > 0) {
    const firstLine = clientLines.slice(0, 2).join('  ·  ');
    doc.text(firstLine, margin + 4, y + 19);
    if (clientLines.length > 2) {
      doc.text(clientLines.slice(2).join('  ·  '), margin + 4, y + 25);
    }
  } else {
    doc.text('Sin detalles de contacto registrados', margin + 4, y + 19);
  }

  y += clientBoxHeight + 8;

  const shiftHours = invoice.hoursPerShift || 24;
  const grossShiftInfo = formatWorkedTimeInShifts(invoice.summary.grossHours, shiftHours);
  const lostShiftInfo = formatWorkedTimeInShifts(invoice.summary.lostHours, shiftHours);
  const shiftInfo = formatWorkedTimeInShifts(invoice.summary.netHours, shiftHours);

  // Tiempo Principal Section
  doc.setTextColor(40, 65, 154);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Detalle de Tiempo Principal', margin, y);
  y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    `Inicio: ${formatDateDisplay(invoice.timeRange.startDate)}  ${formatTime12h(invoice.timeRange.startTime)}`,
    margin + 4,
    y + 7.5
  );
  doc.text(
    `Fin:    ${formatDateDisplay(invoice.timeRange.endDate)}  ${formatTime12h(invoice.timeRange.endTime)}`,
    margin + 4,
    y + 14.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 65, 154);
  doc.setFontSize(11);
  doc.text(
    `Tiempo Bruto: ${formatHours(invoice.summary.grossHours)}`,
    pageWidth - margin - 4,
    y + 8,
    { align: 'right' }
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(grossShiftInfo.formatted, pageWidth - margin - 4, y + 14.5, {
    align: 'right',
  });

  y += 28;

  // Horas Perdidas Section
  doc.setTextColor(40, 65, 154);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Descuento de Horas Perdidas', margin, y);
  y += 5;

  if (invoice.lostEntries.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sin horas perdidas registradas.', margin + 2, y + 4);
    y += 10;
  } else {
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Motivo / Tramo', margin + 4, y + 5.5);
    doc.text('Duración', pageWidth - margin - 4, y + 5.5, { align: 'right' });
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    invoice.lostEntries.forEach((entry, idx) => {
      if (y > 235) {
        doc.addPage();
        y = 20;
      }
      doc.setTextColor(30, 41, 59);
      const label = entry.label || `Pérdida ${idx + 1}`;
      const rangeSuffix =
        entry.startDate && entry.startTime && entry.endDate && entry.endTime
          ? ` (${formatDateDisplay(entry.startDate)} ${formatTime12h(
              entry.startTime
            )} - ${formatDateDisplay(entry.endDate)} ${formatTime12h(entry.endTime)})`
          : entry.startTime && entry.endTime
          ? ` (${formatTime12h(entry.startTime)} - ${formatTime12h(entry.endTime)})`
          : '';
      doc.text(`${label}${rangeSuffix}`, margin + 4, y + 5.5);
      doc.text(`- ${formatHours(entry.hours)}`, pageWidth - margin - 4, y + 5.5, {
        align: 'right',
      });
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);
      y += 8;
    });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 65, 154);
    doc.setFontSize(9.5);
    doc.text(
      `Total Horas Perdidas: ${formatHours(invoice.summary.lostHours)} (${lostShiftInfo.formatted})`,
      pageWidth - margin - 4,
      y + 6,
      { align: 'right' }
    );
    y += 12;
  }

  y += 4;

  // Resumen de Tiempo Trabajado
  doc.setDrawColor(30, 130, 76); // #1E824C
  doc.setLineWidth(0.5);
  doc.setFillColor(244, 251, 247);
  const boxHeight = 56;
  doc.roundedRect(margin, y, contentWidth, boxHeight, 2.5, 2.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Resumen de Tiempo Trabajado', margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Horas Brutas:', margin + 5, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(formatHours(invoice.summary.grossHours), pageWidth - margin - 5, y + 16, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.text('Horas Netas Trabajadas (decimal):', margin + 5, y + 22);
  doc.setFont('helvetica', 'bold');
  doc.text(formatHours(invoice.summary.netHours), pageWidth - margin - 5, y + 22, {
    align: 'right',
  });

  doc.setFont('helvetica', 'normal');
  doc.text('Tiempo Neto:', margin + 5, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.text(shiftInfo.formatted, pageWidth - margin - 5, y + 28, {
    align: 'right',
  });

  const shiftPriceNio = invoice.shiftPriceNio ?? (invoice.summary.hourlyRate || 0) * 24;
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Precio de Turno (${formatCurrency(shiftPriceNio, 'C$')} ÷ 24):`,
    margin + 5,
    y + 34
  );
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${formatCurrency(invoice.summary.hourlyRate, 'C$')}/hr`,
    pageWidth - margin - 5,
    y + 34,
    { align: 'right' }
  );

  doc.setDrawColor(187, 247, 208);
  doc.line(margin + 5, y + 39, pageWidth - margin - 5, y + 39);

  const totalLineY = y + 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL A PAGAR:', margin + 5, totalLineY);
  doc.text(formatCurrency(invoice.summary.total, 'C$'), pageWidth - margin - 5, totalLineY, {
    align: 'right',
  });

  y += boxHeight + 10;

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const footerText = business.businessName
    ? `Generado con Calculadora de Tiempo · ${business.businessName}`
    : 'Generado con Calculadora de Tiempo';
  doc.text(footerText, margin, pageHeight - 10);

  return doc;
}

export function getInvoiceFilename(invoice: InvoiceRecord): string {
  const safeClient = (invoice.clientName || 'Cliente')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .slice(0, 24);
  return `Reporte_${invoice.invoiceNumber}_${safeClient}.pdf`;
}

export function downloadInvoicePdf(
  invoice: InvoiceRecord,
  business: BusinessProfile
): string {
  const doc = buildInvoicePdfDoc(invoice, business);
  const filename = getInvoiceFilename(invoice);
  doc.save(filename);
  return filename;
}

export async function shareInvoicePdf(
  invoice: InvoiceRecord,
  business: BusinessProfile
): Promise<{ method: 'web_share' | 'download_fallback'; filename: string }> {
  const doc = buildInvoicePdfDoc(invoice, business);
  const filename = getInvoiceFilename(invoice);
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });

  const shiftInfo = formatWorkedTimeInShifts(
    invoice.summary.netHours,
    invoice.hoursPerShift || 24
  );
  const shareText = `Reporte ${invoice.invoiceNumber} - ${invoice.clientName || 'Cliente'}\nHoras netas: ${formatHours(
    invoice.summary.netHours
  )}\nTiempo trabajado: ${shiftInfo.formatted}`;

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({
      title: `Reporte ${invoice.invoiceNumber}`,
      text: shareText,
      files: [file],
    });
    return { method: 'web_share', filename };
  }

  doc.save(filename);
  return { method: 'download_fallback', filename };
}
