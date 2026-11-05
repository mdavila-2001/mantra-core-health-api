import PDFDocument from 'pdfkit';
import {
  brandHeight,
  drawBrandAlovida,
} from '../../clinical/services/alovida-mark';
import { drawQr } from '../../clinical/services/prescription-qr';
import type { ReportBody, ReportRun } from './report-body';

const MARGIN = 50;
/** Bottom band kept free on every page for the footer. */
const FOOTER_BAND = 110;
const BRAND: readonly [number, number, number] = [0x0b, 0x3d, 0x4d];
const BODY_SIZE = 10;
const SIGNATURE_BLOCK = 160;

/** One signature column: images already read on the server. */
export interface ReportPdfSignature {
  readonly signature: Buffer | null;
  readonly seal: Buffer | null;
  readonly lines: readonly string[];
}

/** Everything the official (or preview) PDF prints, already resolved. */
export interface ReportPdfInput {
  readonly issuerName: string;
  readonly issuerLogo: Buffer | null;
  readonly patientName: string;
  readonly patientCode: string | null;
  readonly studyName: string;
  readonly requesterName: string;
  readonly requestedAt: Date;
  readonly issuedAt: Date | null;
  readonly body: ReportBody;
  readonly lab: ReportPdfSignature;
  readonly signer: ReportPdfSignature;
  /** `null` renders the preview: watermark «BORRADOR», no hash, no QR. */
  readonly official: {
    readonly contentHash: string;
    readonly verifyUrl: string;
  } | null;
}

const formatDate = (date: Date): string =>
  date.toLocaleDateString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

function fontOf(run: ReportRun): string {
  if (run.bold && run.italic) return 'Helvetica-BoldOblique';
  if (run.bold) return 'Helvetica-Bold';
  if (run.italic) return 'Helvetica-Oblique';
  return 'Helvetica';
}

/** Draws an image when pdfkit can decode it; a broken image is left out. */
function tryImage(
  doc: PDFKit.PDFDocument,
  image: Buffer | null,
  x: number,
  y: number,
  fit: [number, number],
): void {
  if (!image) return;
  try {
    doc.image(image, x, y, { fit });
  } catch {
    // Unsupported format (pdfkit embeds PNG and JPEG only): the text still identifies the signer.
  }
}

function writeRuns(
  doc: PDFKit.PDFDocument,
  runs: readonly ReportRun[],
  prefix = '',
): void {
  const visible = runs.filter((run) => run.text !== '');
  if (visible.length === 0) {
    doc.font('Helvetica').text(prefix || ' ');
    return;
  }
  if (prefix) doc.font('Helvetica').text(prefix, { continued: true });
  visible.forEach((run, i) =>
    doc.font(fontOf(run)).text(run.text, {
      continued: i < visible.length - 1,
      underline: run.underline === true,
    }),
  );
}

function drawHeader(doc: PDFKit.PDFDocument, input: ReportPdfInput): void {
  tryImage(doc, input.issuerLogo, MARGIN, MARGIN, [90, 50]);
  const brandWidth = 30;
  const right = doc.page.width - MARGIN;
  drawBrandAlovida(doc, {
    x: right - brandWidth,
    y: MARGIN,
    ancho: brandWidth,
    color: BRAND,
  });
  doc.fillColor('#0b3d4d').font('Helvetica-Bold').fontSize(9);
  doc.text('AloVida', right - 80, MARGIN + brandHeight(brandWidth) + 4, {
    width: 80,
    align: 'right',
  });
  doc.fillColor('#000000').fontSize(14);
  doc.text(input.issuerName, MARGIN + 100, MARGIN + 6, {
    width: right - MARGIN - 200,
  });
  doc
    .font('Helvetica')
    .fontSize(11)
    .text('Informe de resultados', { width: right - MARGIN - 200 });
  doc.y = MARGIN + 70;
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(right, doc.y)
    .strokeColor('#0b3d4d')
    .stroke();
  doc.moveDown(0.8);
}

function drawData(doc: PDFKit.PDFDocument, input: ReportPdfInput): void {
  const rows: [string, string][] = [
    [
      'Paciente',
      input.patientCode
        ? `${input.patientName} (${input.patientCode})`
        : input.patientName,
    ],
    ['Estudio', input.studyName],
    ['Médico solicitante', input.requesterName],
    ['Fecha de pedido', formatDate(input.requestedAt)],
    [
      'Fecha de emisión',
      input.issuedAt ? formatDate(input.issuedAt) : 'Borrador sin emitir',
    ],
  ];
  doc.fontSize(BODY_SIZE);
  for (const [label, value] of rows) {
    doc
      .font('Helvetica-Bold')
      .text(`${label}: `, MARGIN, doc.y, { continued: true });
    doc.font('Helvetica').text(value);
  }
  doc.moveDown(1);
}

function drawBody(doc: PDFKit.PDFDocument, body: ReportBody): void {
  for (const block of body.blocks) {
    if (block.type === 'heading') {
      doc
        .moveDown(0.4)
        .font('Helvetica-Bold')
        .fontSize(block.level === 2 ? 13 : 11);
      doc.text(block.text, MARGIN);
      doc.fontSize(BODY_SIZE).moveDown(0.2);
    } else if (block.type === 'paragraph') {
      doc.fontSize(BODY_SIZE);
      writeRuns(doc, block.runs);
      doc.moveDown(0.5);
    } else {
      doc.fontSize(BODY_SIZE);
      block.items.forEach((item, i) =>
        writeRuns(doc, item, block.ordered ? `${i + 1}. ` : '• '),
      );
      doc.moveDown(0.5);
    }
  }
}

function drawSignatures(doc: PDFKit.PDFDocument, input: ReportPdfInput): void {
  if (doc.y + SIGNATURE_BLOCK > doc.page.height - FOOTER_BAND) doc.addPage();
  const top = doc.y + 10;
  const columnWidth = (doc.page.width - MARGIN * 2 - 30) / 2;
  [input.lab, input.signer].forEach((column, i) => {
    const x = MARGIN + i * (columnWidth + 30);
    tryImage(doc, column.signature, x, top, [columnWidth - 80, 60]);
    tryImage(doc, column.seal, x + columnWidth - 70, top, [70, 70]);
    const lineY = top + 75;
    doc
      .moveTo(x, lineY)
      .lineTo(x + columnWidth, lineY)
      .strokeColor('#000000')
      .stroke();
    doc.fontSize(9).font('Helvetica');
    doc.text(column.lines.join('\n'), x, lineY + 4, {
      width: columnWidth,
      align: 'center',
    });
  });
  doc.y = top + SIGNATURE_BLOCK;
}

function drawFooters(doc: PDFKit.PDFDocument, input: ReportPdfInput): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    // Writing inside the bottom margin would otherwise open a new page.
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - FOOTER_BAND + 15;
    const width = doc.page.width - MARGIN * 2 - (input.official ? 90 : 0);
    if (!input.official) {
      doc.save().opacity(0.15).fillColor('#c0392b').fontSize(72);
      doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
      doc.text('BORRADOR', 0, doc.page.height / 2 - 36, {
        align: 'center',
        width: doc.page.width,
      });
      doc.restore();
    }
    doc.fillColor('#000000').font('Helvetica').fontSize(7.5);
    const legend = input.official
      ? `Documento publicado e inmutable. SHA-256: ${input.official.contentHash}\nVerificación: ${input.official.verifyUrl}`
      : 'Vista previa del borrador: sin validez oficial.';
    doc.text(legend, MARGIN, y, { width });
    doc.text(
      `Página ${i - range.start + 1} de ${range.count}`,
      MARGIN,
      y + 45,
      { width },
    );
    if (input.official)
      drawQr(
        doc,
        input.official.verifyUrl,
        doc.page.width - MARGIN - 85,
        y - 10,
        85,
      );
    doc.page.margins.bottom = bottom;
  }
}

/** Renders the report with pdfkit; the only function of the flow that touches the library. */
export function drawReportPdf(input: ReportPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      bufferPages: true,
      margins: {
        top: MARGIN,
        left: MARGIN,
        right: MARGIN,
        bottom: FOOTER_BAND,
      },
      info: {
        Title: `Informe de resultados - ${input.studyName}`,
        Keywords: input.official
          ? `sha256:${input.official.contentHash}`
          : 'borrador',
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    drawHeader(doc, input);
    drawData(doc, input);
    drawBody(doc, input.body);
    drawSignatures(doc, input);
    drawFooters(doc, input);
    doc.end();
  });
}
