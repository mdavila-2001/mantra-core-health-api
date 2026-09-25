import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  dibujarMarcaAlovida,
  altoDeMarca,
} from '../../clinical/services/alovida-mark';
import { dibujarQr } from '../../clinical/services/prescription-qr';
import type { InsurancePortabilityReportDto } from '../dto/insurance-portability.dto';

/**
 * Reutiliza el membrete de recetas (`clinical/services/alovida-mark.ts` y
 * `prescription-qr.ts`): son helpers de dibujo puro sobre `pdfkit`, sin
 * estado ni dependencia de nada clínico. `insurance.module.ts` ya importa la
 * clase `DuplicateStudyDetector` de `clinical` con el mismo criterio —
 * relocalizarlos a un paquete común de PDF (`src/common/pdf/`) queda
 * declarado como deuda, no se hace en esta subtarea.
 */
const PAGE_MARGIN = 56;
const TITLE_FONT_SIZE = 16;
const SECTION_FONT_SIZE = 11;
const BODY_FONT_SIZE = 9.5;
const FOOTER_FONT_SIZE = 8;
const LINE_GAP = 3;
const MARK_COLOR: readonly [number, number, number] = [0x0b, 0x3d, 0x4d];
/** Reclamos por encima de este monto se destacan en el resumen (el prompt lo pide). */
const HIGH_CLAIM_THRESHOLD = 2000;

/** Una fila lista para imprimir, ya con sus columnas formateadas como texto. */
interface TableRow {
  readonly columns: readonly string[];
}

/** El contenido del certificado, ya resuelto a texto — sin pdfkit de por medio. */
export interface PortabilitySheet {
  readonly title: string;
  readonly subtitle: string;
  readonly member: readonly string[];
  readonly policies: readonly string[];
  readonly encounters: readonly string[];
  readonly claimsHeader: readonly string[];
  readonly claimRows: readonly TableRow[];
  readonly summary: readonly string[];
  readonly highlights: readonly string[];
  readonly legalNotice: string;
  readonly footer: string;
  readonly contentHash: string;
  readonly qrUrl: string;
}

/**
 * Arma el contenido del certificado como texto plano, sin tocar `pdfkit`.
 *
 * Separada de {@link draw} por la misma razón que `armarReceta` en
 * `prescription-pdf.service.ts`: un test puede asegurar el texto exacto sin
 * levantar un documento PDF real.
 */
export function buildCertificate(
  report: InsurancePortabilityReportDto,
  manifestHash: string,
  qrUrl: string,
): PortabilitySheet {
  const member = [
    `Titular: ${report.patient.fullName}`,
    report.patient.nationalId
      ? `Documento: ${report.patient.nationalId}${report.patient.nationalIdArea ? ' ' + report.patient.nationalIdArea : ''}`
      : 'Documento: no declarado',
    `Certificado: ${report.certificateId}`,
    `Emitido: ${report.generatedAt}`,
  ];

  const policies = report.policies.length
    ? report.policies.map(
        (policy) =>
          `${policy.carrierName} — ${policy.planName ?? 'Plan sin nombre'} · póliza ${policy.policyIdentifier ?? 's/n'} · ${policy.status}${policy.verified ? ' · verificada' : ''} (${policy.startDate ?? '…'} a ${policy.endDate ?? 'vigente'})`,
      )
    : ['El titular no declaró ninguna póliza.'];

  const encounters = report.encounters.length
    ? report.encounters.map(
        (encounter) =>
          `${encounter.startAt?.slice(0, 10) ?? 's/f'} · ${encounter.organizationName ?? 'No identificado'}${encounter.branchName ? ` (${encounter.branchName})` : ''} · ${encounter.status}`,
      )
    : ['Sin atenciones registradas.'];

  const claimsHeader = [
    'Fecha',
    'Aseguradora',
    'Prestador',
    'Facturado',
    'Cubierto',
    'Copago',
    'Estado',
  ];
  const claimRows = report.claims.map((claim) => ({
    columns: [
      claim.submittedAt?.slice(0, 10) ?? 's/f',
      claim.carrierName,
      claim.providerName ?? 'No identificado',
      `${claim.billedTotal} ${claim.currencyCode ?? ''}`.trim(),
      claim.approvedTotal
        ? `${claim.approvedTotal} ${claim.currencyCode ?? ''}`.trim()
        : '—',
      claim.patientTotal
        ? `${claim.patientTotal} ${claim.currencyCode ?? ''}`.trim()
        : '—',
      claim.status,
    ],
  }));

  const currency = report.summary.currencyCode ?? '';
  const summary = [
    `Reclamos totales: ${report.summary.allTime.claimsCount} (aprobados ${report.summary.allTime.approvedCount} · denegados ${report.summary.allTime.deniedCount} · pendientes ${report.summary.allTime.pendingCount})`,
    `Total facturado: ${report.summary.allTime.billedAmount} ${currency}`.trim(),
    `Total cubierto: ${report.summary.allTime.coveredAmount} ${currency}`.trim(),
    `Copago del titular: ${report.summary.allTime.patientCopayAmount} ${currency}`.trim(),
    `Denegado: ${report.summary.allTime.deniedAmount} ${currency}`.trim(),
    `Últimos 36 meses: ${report.summary.last36Months.claimsCount} reclamos · ${report.summary.last36Months.coveredAmount} ${currency} cubiertos`.trim(),
    report.summary.estimatedLossRatioPercent !== null
      ? `Siniestralidad estimada: ${report.summary.estimatedLossRatioPercent} % (contra la prima de lista declarada)`
      : 'Siniestralidad estimada: no calculable (ningún plan declaró prima)',
  ];

  const highlights = report.claims
    .filter((claim) => Number(claim.billedTotal) > HIGH_CLAIM_THRESHOLD)
    .map((claim) =>
      `${claim.claimIdentifier} · ${claim.submittedAt?.slice(0, 10) ?? 's/f'} · ${claim.billedTotal} ${claim.currencyCode ?? ''}`.trim(),
    );

  return {
    title: 'Certificado de portabilidad de siniestralidad',
    subtitle:
      'Historial de coberturas, atenciones y siniestros del titular — AloVida',
    member,
    policies,
    encounters,
    claimsHeader,
    claimRows,
    summary,
    highlights,
    legalNotice:
      'Este documento resume el ejercicio del derecho de portabilidad del titular sobre su propio historial de seguros de salud. No constituye una autorización de traspaso entre aseguradoras.',
    footer: `Sello digital: SHA-256 ${manifestHash} · verificar en ${qrUrl}`,
    contentHash: manifestHash,
    qrUrl,
  };
}

/** Dibuja el papel armado con `pdfkit` y devuelve el PDF como `Buffer`. */
export function draw(sheet: PortabilitySheet): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: PAGE_MARGIN,
      info: {
        Title: sheet.title,
        Subject: 'Portabilidad de póliza y siniestralidad',
        Keywords: `sello:${sheet.contentHash}`,
      },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (error: Error) => reject(error));

    try {
      const markWidth = 28;
      dibujarMarcaAlovida(doc, {
        x: PAGE_MARGIN,
        y: PAGE_MARGIN,
        ancho: markWidth,
        color: MARK_COLOR,
      });
      doc
        .fontSize(TITLE_FONT_SIZE)
        .fillColor('#000000')
        .text(sheet.title, PAGE_MARGIN + markWidth + 12, PAGE_MARGIN + 2);
      doc
        .fontSize(BODY_FONT_SIZE)
        .fillColor('#444444')
        .text(
          sheet.subtitle,
          PAGE_MARGIN + markWidth + 12,
          PAGE_MARGIN + 2 + TITLE_FONT_SIZE + 2,
        );

      doc.y =
        PAGE_MARGIN + Math.max(altoDeMarca(markWidth), TITLE_FONT_SIZE) + 24;
      doc.x = PAGE_MARGIN;

      section(doc, 'Afiliado', sheet.member);
      section(doc, 'Pólizas y coberturas declaradas', sheet.policies);
      section(doc, 'Atenciones', sheet.encounters);

      doc
        .fontSize(SECTION_FONT_SIZE)
        .fillColor('#0b3d4d')
        .text('Siniestros y prestaciones', { continued: false });
      doc.moveDown(0.3);
      table(doc, sheet.claimsHeader, sheet.claimRows);
      doc.moveDown(0.6);

      section(doc, 'Resumen actuarial', sheet.summary);
      if (sheet.highlights.length > 0) {
        section(
          doc,
          `Reclamos superiores a Bs ${HIGH_CLAIM_THRESHOLD}`,
          sheet.highlights,
        );
      }

      doc
        .fontSize(FOOTER_FONT_SIZE)
        .fillColor('#666666')
        .text(
          sheet.legalNotice,
          PAGE_MARGIN,
          doc.page.height - PAGE_MARGIN - 90,
          {
            width: doc.page.width - PAGE_MARGIN * 2 - 90,
          },
        );

      const qrSide = 70;
      const qrX = doc.page.width - PAGE_MARGIN - qrSide;
      const qrY = doc.page.height - PAGE_MARGIN - 90;
      dibujarQr(doc, sheet.qrUrl, qrX, qrY, qrSide);

      doc
        .font('Courier')
        .fontSize(FOOTER_FONT_SIZE)
        .fillColor('#000000')
        .text(sheet.footer, PAGE_MARGIN, doc.page.height - PAGE_MARGIN - 14, {
          width: doc.page.width - PAGE_MARGIN * 2 - qrSide - 12,
        });

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

/** Un título de sección + sus líneas, con el espaciado del resto del documento. */
function section(
  doc: PDFKit.PDFDocument,
  title: string,
  lines: readonly string[],
): void {
  doc.fontSize(SECTION_FONT_SIZE).fillColor('#0b3d4d').text(title);
  doc.moveDown(0.2);
  doc.fontSize(BODY_FONT_SIZE).fillColor('#000000');
  for (const line of lines) {
    doc.text(line, { lineGap: LINE_GAP });
  }
  doc.moveDown(0.5);
}

/** Una tabla simple de ancho fijo, sin motor de tablas (el proyecto no tiene uno). */
function table(
  doc: PDFKit.PDFDocument,
  header: readonly string[],
  rows: readonly TableRow[],
): void {
  doc.fontSize(BODY_FONT_SIZE).fillColor('#000000');
  if (rows.length === 0) {
    doc.text('Sin reclamos registrados en el período.');
    return;
  }
  doc.font('Helvetica-Bold').text(header.join('  ·  '));
  doc.font('Helvetica');
  for (const row of rows) {
    doc.text(row.columns.join('  ·  '), { lineGap: LINE_GAP });
  }
}

/**
 * El servicio de PDF del certificado de portabilidad — molde de
 * `PrescriptionPdfService`: contenido puro ({@link buildCertificate}) +
 * dibujo con `pdfkit` ({@link draw}), separados para que un test asegure
 * el texto sin levantar un documento real.
 */
@Injectable()
export class InsurancePortabilityPdfService {
  render(
    report: InsurancePortabilityReportDto,
    manifestHash: string,
    qrUrl: string,
  ): Promise<Buffer> {
    const sheet = buildCertificate(report, manifestHash, qrUrl);
    return draw(sheet);
  }
}
