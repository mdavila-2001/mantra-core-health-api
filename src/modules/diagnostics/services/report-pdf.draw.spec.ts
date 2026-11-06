import { describe, expect, it } from '@jest/globals';
import { drawReportPdf, type ReportPdfInput } from './report-pdf.draw';

const input = (over: Partial<ReportPdfInput> = {}): ReportPdfInput => ({
  issuerName: 'Laboratorio Sintético',
  issuerLogo: null,
  patientName: 'Paciente Sintético',
  patientCode: 'P-001',
  studyName: 'Hemograma',
  requesterName: 'Dra. Prueba',
  requestedAt: new Date('2026-11-01T10:00:00Z'),
  issuedAt: new Date('2026-11-05T10:00:00Z'),
  body: {
    version: 1,
    blocks: Array.from({ length: 80 }, (_, i) => ({
      type: 'paragraph' as const,
      runs: [
        { text: `Línea ${i} `, bold: i % 2 === 0 },
        { text: 'cursiva', italic: true, underline: true },
      ],
    })),
  },
  lab: {
    signature: null,
    seal: Buffer.from('not an image'),
    lines: ['Responsable'],
  },
  signer: {
    signature: null,
    seal: null,
    lines: ['Dr. Firmante', 'Matrícula: 123'],
  },
  official: {
    contentHash: 'a'.repeat(64),
    verifyUrl: 'http://localhost:4200/verify/informe/v1',
  },
  ...over,
});

describe('drawReportPdf', () => {
  it('renders a multi-page official PDF and tolerates an undecodable image', async () => {
    const pdf = await drawReportPdf(input());
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(
      (pdf.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length,
    ).toBeGreaterThan(1);
  });

  it('renders the preview without hash', async () => {
    const pdf = await drawReportPdf(input({ official: null, issuedAt: null }));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString('latin1')).toContain('borrador');
  });
});
