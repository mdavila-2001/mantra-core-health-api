import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DuplicateStudyDetector } from './duplicate-study-detector';
import { DiagnosticReports, ServiceRequests } from '../entities';
import { DiagnosticReportVersions } from '../../diagnostics/entities';
import { CatalogConcepts } from '../../terminology/entities';
import { Tenants } from '../../directory/entities';
import { CLIN } from '../clinical.concepts';

const PATIENT = 'p1';
const CODE = 'code-eco-abd';
const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const NOW = new Date('2026-09-17T12:00:00Z');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Construye el sistema bajo prueba con un `EntityManager` que dispatchea por
 * clase de entidad, igual que MikroORM pero sin base.
 */
function build(data: {
  reports?: any[];
  revokedOrders?: any[];
  versions?: any[];
  designations?: Map<string, any>;
  concepts?: any[];
  tenants?: any[];
}) {
  const find = mockFn((Entity: unknown, _where: unknown) => {
    if (Entity === DiagnosticReports)
      return Promise.resolve(data.reports ?? []);
    if (Entity === ServiceRequests)
      return Promise.resolve(data.revokedOrders ?? []);
    if (Entity === DiagnosticReportVersions)
      return Promise.resolve(data.versions ?? []);
    return Promise.resolve([]);
  });
  const findOne = mockFn((Entity: unknown, where: any) => {
    if (Entity === CatalogConcepts) {
      return Promise.resolve(
        (data.concepts ?? []).find((c) => c.id === where.id) ?? null,
      );
    }
    if (Entity === Tenants) {
      return Promise.resolve(
        (data.tenants ?? []).find((t) => t.id === where.id) ?? null,
      );
    }
    if (Entity === DiagnosticReports) {
      return Promise.resolve(
        (data.reports ?? []).find((r) => r.id === where.id) ?? null,
      );
    }
    if (Entity === DiagnosticReportVersions) {
      return Promise.resolve(
        (data.versions ?? []).find((v) => v.id === where.id) ?? null,
      );
    }
    return Promise.resolve(null);
  });
  const em = { find, findOne } as any;
  const conceptDesignations = {
    findPreferredByLanguageForConcepts: mockFn().mockResolvedValue(
      data.designations ?? new Map(),
    ),
  };
  const detector = new DuplicateStudyDetector(conceptDesignations as any);
  return { detector, em, conceptDesignations };
}

/** Un informe con los campos que el detector proyecta. */
function informe(over: Partial<any> = {}) {
  return {
    id: 'report-1',
    patientProfileId: PATIENT,
    codeConceptId: CODE,
    custodianTenantId: TENANT_A,
    serviceRequestId: 'sr-1',
    lifecycleStatusConceptId: CLIN.REPORT_PARTIAL,
    resultReleaseStatusConceptId: undefined,
    currentReleasedVersionId: undefined,
    updatedAt: daysAgo(14),
    ...over,
  };
}

/** Una versión liberada con los campos que el detector proyecta. */
function version(over: Partial<any> = {}) {
  return {
    id: 'version-1',
    diagnosticReportId: 'report-1',
    issuedAt: daysAgo(14),
    recordedAt: daysAgo(14),
    performerTenantId: TENANT_A,
    conclusionText: 'Sin hallazgos.',
    ...over,
  };
}

describe('DuplicateStudyDetector', () => {
  describe('findDuplicate', () => {
    it('finds a report released via diagnostics (current_released_version_id present)', async () => {
      const { detector, em } = build({
        reports: [informe({ currentReleasedVersionId: 'version-1' })],
        versions: [version()],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match).not.toBeNull();
      expect(match?.resultsAvailable).toBe(true);
    });

    it('finds a report released via clinical (lifecycle FINAL, no version)', async () => {
      const { detector, em } = build({
        reports: [informe({ lifecycleStatusConceptId: CLIN.REPORT_FINAL })],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match).not.toBeNull();
      expect(match?.version).toBeNull();
    });

    it('returns null when the report is outside the window', async () => {
      const { detector, em } = build({
        reports: [
          informe({
            lifecycleStatusConceptId: CLIN.REPORT_FINAL,
            updatedAt: daysAgo(45),
          }),
        ],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match).toBeNull();
    });

    it('finds the same 45-day-old report with a 60-day window', async () => {
      const { detector, em } = build({
        reports: [
          informe({
            lifecycleStatusConceptId: CLIN.REPORT_FINAL,
            updatedAt: daysAgo(45),
          }),
        ],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 60, NOW);
      expect(match).not.toBeNull();
    });

    it('does not count a PARTIAL report without a released version as a duplicate', async () => {
      const { detector, em } = build({
        reports: [informe({ lifecycleStatusConceptId: CLIN.REPORT_PARTIAL })],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match).toBeNull();
    });

    it('excludes reports whose originating order was revoked', async () => {
      const { detector, em } = build({
        reports: [
          informe({
            lifecycleStatusConceptId: CLIN.REPORT_FINAL,
            serviceRequestId: 'sr-1',
          }),
        ],
        revokedOrders: [
          { id: 'sr-1', statusConceptId: CLIN.SERVICE_REQUEST_REVOKED },
        ],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match).toBeNull();
    });

    it('falls back to report.updatedAt as performedAt when there is no version', async () => {
      const updatedAt = daysAgo(5);
      const { detector, em } = build({
        reports: [
          informe({ lifecycleStatusConceptId: CLIN.REPORT_FINAL, updatedAt }),
        ],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match?.performedAt).toEqual(updatedAt);
    });
  });

  describe('describe', () => {
    it('computes daysAgo against the given reference date', async () => {
      const { detector, em } = build({
        concepts: [{ id: CODE, display: 'Abdominal ultrasound' }],
      });
      const match = {
        report: informe(),
        version: null,
        performedAt: daysAgo(14),
        resultsAvailable: true,
      };
      const description = await detector.describe(
        em,
        match as any,
        TENANT_A,
        NOW,
        true,
      );
      expect(description.daysAgo).toBe(14);
    });

    it('never returns the conclusion when the report belongs to another organization', async () => {
      const { detector, em } = build({
        concepts: [{ id: CODE, display: 'Abdominal ultrasound' }],
      });
      const match = {
        report: informe({ custodianTenantId: TENANT_A }),
        version: version(),
        performedAt: daysAgo(14),
        resultsAvailable: true,
      };
      const description = await detector.describe(
        em,
        match as any,
        TENANT_B,
        NOW,
        true,
      );
      expect(description.sameOrganization).toBe(false);
      expect(description.conclusionText).toBeNull();
    });

    it('returns the conclusion when same organization and includeConclusion is true', async () => {
      const { detector, em } = build({
        concepts: [{ id: CODE, display: 'Abdominal ultrasound' }],
      });
      const match = {
        report: informe({ custodianTenantId: TENANT_A }),
        version: version({ conclusionText: 'Riñones normales.' }),
        performedAt: daysAgo(14),
        resultsAvailable: true,
      };
      const description = await detector.describe(
        em,
        match as any,
        TENANT_A,
        NOW,
        true,
      );
      expect(description.conclusionText).toBe('Riñones normales.');
    });

    it('never returns the conclusion when includeConclusion is false, even same organization', async () => {
      const { detector, em } = build({
        concepts: [{ id: CODE, display: 'Abdominal ultrasound' }],
      });
      const match = {
        report: informe({ custodianTenantId: TENANT_A }),
        version: version({ conclusionText: 'Riñones normales.' }),
        performedAt: daysAgo(14),
        resultsAvailable: true,
      };
      const description = await detector.describe(
        em,
        match as any,
        TENANT_A,
        NOW,
        false,
      );
      expect(description.conclusionText).toBeNull();
    });

    it('prefers the Spanish designation over catalog display', async () => {
      const designations = new Map([[CODE, { value: 'Ecografía abdominal' }]]);
      const { detector, em } = build({
        designations,
        concepts: [{ id: CODE, display: 'Abdominal ultrasound' }],
      });
      const match = {
        report: informe(),
        version: null,
        performedAt: daysAgo(14),
        resultsAvailable: true,
      };
      const description = await detector.describe(
        em,
        match as any,
        TENANT_A,
        NOW,
        true,
      );
      expect(description.studyName).toBe('Ecografía abdominal');
    });

    it('falls back to catalog display when there is no designation', async () => {
      const { detector, em } = build({
        concepts: [{ id: CODE, display: 'Abdominal ultrasound' }],
      });
      const match = {
        report: informe(),
        version: null,
        performedAt: daysAgo(14),
        resultsAvailable: true,
      };
      const description = await detector.describe(
        em,
        match as any,
        TENANT_A,
        NOW,
        true,
      );
      expect(description.studyName).toBe('Abdominal ultrasound');
    });

    it('resolves providerName from the tenant, falling back to a neutral text', async () => {
      const { detector, em } = build({
        concepts: [{ id: CODE, display: 'x' }],
        tenants: [{ id: TENANT_A, legalName: 'Laboratorio Central AloVida' }],
      });
      const match = {
        report: informe({ custodianTenantId: TENANT_A }),
        version: null,
        performedAt: daysAgo(14),
        resultsAvailable: true,
      };
      const description = await detector.describe(
        em,
        match as any,
        TENANT_A,
        NOW,
        true,
      );
      expect(description.providerName).toBe('Laboratorio Central AloVida');
    });

    it('never returns a reportDownloadUrl', async () => {
      const { detector, em } = build({
        concepts: [{ id: CODE, display: 'x' }],
      });
      const match = {
        report: informe(),
        version: null,
        performedAt: daysAgo(14),
        resultsAvailable: true,
      };
      const description = await detector.describe(
        em,
        match as any,
        TENANT_A,
        NOW,
        true,
      );
      expect(description.reportDownloadUrl).toBeNull();
    });
  });

  describe('findPendingReport', () => {
    it('returns true when there is an unreleased report of the same study within the window', async () => {
      const { detector, em } = build({
        reports: [informe({ lifecycleStatusConceptId: CLIN.REPORT_PARTIAL })],
      });
      const pending = await detector.findPendingReport(
        em,
        PATIENT,
        CODE,
        30,
        NOW,
      );
      expect(pending).toBe(true);
    });

    it('returns false when the report is already final', async () => {
      const { detector, em } = build({
        reports: [informe({ lifecycleStatusConceptId: CLIN.REPORT_FINAL })],
      });
      const pending = await detector.findPendingReport(
        em,
        PATIENT,
        CODE,
        30,
        NOW,
      );
      expect(pending).toBe(false);
    });
  });
});
