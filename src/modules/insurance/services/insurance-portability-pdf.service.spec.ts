import {
  buildCertificate,
  InsurancePortabilityPdfService,
} from './insurance-portability-pdf.service';
import type { InsurancePortabilityReportDto } from '../dto/insurance-portability.dto';

const HASH = 'e404be51f92fcabebab7b829051cb2522d940ec09c3f5ef8f63ee122d1beedb7';
const QR_URL = `http://localhost:4200/verify/portability/${HASH}`;

/** Un certificado completo, con un poco de todo, para asegurar el texto exacto. */
function reportFixture(
  overrides: Partial<InsurancePortabilityReportDto> = {},
): InsurancePortabilityReportDto {
  return {
    schemaVersion: 'alovida.insurance-portability/2',
    certificateId: 'certificate-a',
    generatedAt: '2026-09-18T18:00:00.000Z',
    issuer: 'AloVida',
    patient: {
      fullName: 'Ana Lucía Pérez',
      nationalId: '4872190',
      nationalIdArea: 'SC',
      birthDate: '1988-04-12',
    },
    policies: [
      {
        coverageId: 'coverage-a',
        carrierName: 'Seguros Andina S.A.',
        planName: 'Plan Oro Familiar',
        productName: 'Oro',
        policyIdentifier: 'POL-99218-ORO',
        memberIdentifier: 'AF-4471',
        relationship: 'RELATIONSHIP_SELF',
        startDate: '2023-01-01',
        endDate: null,
        status: 'COVERAGE_ACTIVE',
        verified: true,
        currencyCode: 'BOB',
        monthlyPremiumAmount: '450.00',
      },
    ],
    encounters: [
      {
        encounterId: 'encounter-a',
        startAt: '2026-06-02T14:30:00.000Z',
        endAt: '2026-06-02T15:10:00.000Z',
        encounterClass: 'ENCOUNTER_CLASS_AMBULATORY',
        type: null,
        status: 'ENCOUNTER_FINISHED',
        organizationName: 'Centro Médico Foianini',
        branchName: null,
      },
    ],
    claims: [
      {
        claimId: 'claim-a',
        claimIdentifier: 'CLM-2026-0891',
        submittedAt: '2026-08-14T00:00:00.000Z',
        carrierName: 'Seguros Andina S.A.',
        policyIdentifier: 'POL-99218-ORO',
        providerType: 'PRACTICE',
        providerName: 'Centro Médico Foianini',
        status: 'CLAIM_PAID',
        outcome: 'ADJUDICATION_APPROVED',
        adjudicatedAt: '2026-08-16T00:00:00.000Z',
        currencyCode: 'BOB',
        billedTotal: '2450.00',
        approvedTotal: '2200.00',
        patientTotal: '250.00',
        deniedTotal: '0.00',
        diagnosisCode: null,
        lines: [],
      },
    ],
    conditions: [],
    summary: {
      currencyCode: 'BOB',
      allTime: {
        claimsCount: 1,
        approvedCount: 1,
        deniedCount: 0,
        pendingCount: 0,
        billedAmount: '2450.00',
        coveredAmount: '2200.00',
        patientCopayAmount: '250.00',
        deniedAmount: '0.00',
        firstClaimAt: '2026-08-14T00:00:00.000Z',
        lastClaimAt: '2026-08-14T00:00:00.000Z',
        coveredMonths: '20.00',
      },
      last36Months: {
        claimsCount: 1,
        approvedCount: 1,
        deniedCount: 0,
        pendingCount: 0,
        billedAmount: '2450.00',
        coveredAmount: '2200.00',
        patientCopayAmount: '250.00',
        deniedAmount: '0.00',
        firstClaimAt: '2026-08-14T00:00:00.000Z',
        lastClaimAt: '2026-08-14T00:00:00.000Z',
        coveredMonths: '20.00',
      },
      byYear: [
        {
          year: 2026,
          claimsCount: 1,
          billedAmount: '2450.00',
          coveredAmount: '2200.00',
        },
      ],
      claimsOver2000Count: 1,
      estimatedLossRatioPercent: '86.14',
    },
    ...overrides,
  };
}

describe('buildCertificate', () => {
  it('arma el afiliado, las pólizas, las atenciones y el pie con el sello y la URL de verificación', () => {
    const sheet = buildCertificate(reportFixture(), HASH, QR_URL);

    expect(sheet.title).toBe('Certificado de portabilidad de siniestralidad');
    expect(sheet.member).toContain('Titular: Ana Lucía Pérez');
    expect(sheet.member).toContain('Documento: 4872190 SC');
    expect(sheet.policies[0]).toContain('Seguros Andina S.A.');
    expect(sheet.encounters[0]).toBe(
      '2026-06-02 · Centro Médico Foianini · ENCOUNTER_FINISHED',
    );
    expect(sheet.footer).toBe(
      `Sello digital: SHA-256 ${HASH} · verificar en ${QR_URL}`,
    );
    expect(sheet.contentHash).toBe(HASH);
    expect(sheet.qrUrl).toBe(QR_URL);
  });

  it('destaca los reclamos por encima de Bs 2000', () => {
    const sheet = buildCertificate(reportFixture(), HASH, QR_URL);
    expect(sheet.highlights).toEqual([
      'CLM-2026-0891 · 2026-08-14 · 2450.00 BOB',
    ]);
  });

  it('sin pólizas declara la ausencia en vez de una lista vacía', () => {
    const sheet = buildCertificate(
      reportFixture({ policies: [] }),
      HASH,
      QR_URL,
    );
    expect(sheet.policies).toEqual(['El titular no declaró ninguna póliza.']);
  });

  it('sin atenciones declara la ausencia en vez de una lista vacía', () => {
    const sheet = buildCertificate(
      reportFixture({ encounters: [] }),
      HASH,
      QR_URL,
    );
    expect(sheet.encounters).toEqual(['Sin atenciones registradas.']);
  });

  it('sin reclamos, la tabla no lleva filas y el resumen no calcula siniestralidad sin prima', () => {
    const sheet = buildCertificate(
      reportFixture({
        claims: [],
        summary: {
          ...reportFixture().summary,
          estimatedLossRatioPercent: null,
        },
      }),
      HASH,
      QR_URL,
    );
    expect(sheet.claimRows).toEqual([]);
    expect(sheet.summary).toContain(
      'Siniestralidad estimada: no calculable (ningún plan declaró prima)',
    );
  });
});

describe('InsurancePortabilityPdfService.render', () => {
  it('devuelve un Buffer que empieza por %PDF- y lleva el sello en los metadatos', async () => {
    const service = new InsurancePortabilityPdfService();
    const buffer = await service.render(reportFixture(), HASH, QR_URL);

    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.includes(`sello:${HASH}`)).toBe(true);
  });
});
