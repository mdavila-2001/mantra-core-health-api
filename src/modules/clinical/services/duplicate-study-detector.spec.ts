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
  /** Filas que devuelve la consulta acotada de `findDuplicate`. */
  duplicateRows?: Array<{ id: string }>;
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
  const execute = mockFn(() => Promise.resolve(data.duplicateRows ?? []));
  const em = { find, findOne, getConnection: () => ({ execute }) } as any;
  const conceptDesignations = {
    findPreferredByLanguageForConcepts: mockFn().mockResolvedValue(
      data.designations ?? new Map(),
    ),
  };
  const detector = new DuplicateStudyDetector(conceptDesignations as any);
  return { detector, em, execute, find, findOne, conceptDesignations };
}

/** Un informe con los campos que el detector proyecta. */
function report(over: Partial<any> = {}) {
  return {
    id: 'report-1',
    patientProfileId: PATIENT,
    codeConceptId: CODE,
    custodianTenantId: TENANT_A,
    serviceRequestId: 'sr-1',
    lifecycleStatusConceptId: CLIN.REPORT_PARTIAL,
    resultReleaseStatusConceptId: undefined,
    currentReleasedVersionId: undefined,
    createdAt: daysAgo(14),
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
    // Qué informe cuenta (ventana, liberado/final, orden revocada) lo decide
    // la consulta en la base; eso lo prueba
    // `test/integration/hardening/mch-029.int-spec.ts` contra PostgreSQL. Acá
    // se fija lo que el detector hace con lo que la consulta devuelve.

    it('MCH-029 · acota la consulta: paciente, estudio, inicio de ventana, criterios y LIMIT 1', async () => {
      const { detector, em, execute } = build({});
      await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);

      const [query, params] = execute.mock.calls[0];
      expect(query).toMatch(/LIMIT 1/);
      expect(query).toMatch(/created_at/);
      expect(query).not.toMatch(/updated_at/);
      expect(params).toEqual([
        PATIENT,
        CODE,
        CLIN.RELEASE_RELEASED,
        CLIN.REPORT_FINAL,
        CLIN.SERVICE_REQUEST_REVOKED,
        daysAgo(30),
      ]);
    });

    it('V10 · sin alcance la consulta es la histórica: sin cláusulas de región ni componentes', async () => {
      const { detector, em, execute } = build({});
      await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(execute.mock.calls[0][0]).not.toMatch(
        /body_site_concept_id|laterality_concept_id|service_request_components/,
      );
    });

    it('V10 · imagen: la clave incluye región y lateralidad (mano izquierda no es mano derecha)', async () => {
      const { detector, em, execute } = build({});
      await detector.findDuplicate(em, PATIENT, CODE, 30, NOW, {
        bodySiteConceptId: 'mano',
        lateralityConceptId: 'izq',
      });
      const [query, params] = execute.mock.calls[0];
      expect(query).toMatch(
        /sr\.body_site_concept_id IS NULL OR sr\.body_site_concept_id = \?::uuid/,
      );
      expect(query).toMatch(
        /sr\.laterality_concept_id IS NULL OR sr\.laterality_concept_id = \?::uuid/,
      );
      expect(query).not.toMatch(/service_request_components/);
      expect(params.slice(-2)).toEqual(['mano', 'izq']);
    });

    it('V10 · laboratorio: componentes no cubiertos por el informe previo no son duplicado', async () => {
      const { detector, em, execute } = build({});
      await detector.findDuplicate(em, PATIENT, CODE, 30, NOW, {
        componentConceptIds: ['hb', 'hto'],
      });
      const [query, params] = execute.mock.calls[0];
      // Una orden previa sin componentes registrados cubre todo («estudio completo»);
      // una con componentes cubre sólo si incluye todos los pedidos.
      expect(query).toMatch(
        /NOT EXISTS \(SELECT 1 FROM clinical\.service_request_components c0/,
      );
      expect(query).toMatch(/unnest\(string_to_array\(\?, ','\)::uuid\[\]\)/);
      expect(params[params.length - 1]).toBe('hb,hto');
    });

    it('V10 · la orden activa sin informe usa el mismo alcance', async () => {
      const { detector, em, execute } = build({});
      await detector.findActiveOrderWithoutReport(
        em,
        PATIENT,
        CODE,
        30,
        TENANT_A,
        NOW,
        {
          bodySiteConceptId: 'mano',
        },
      );
      const [query, params] = execute.mock.calls[0];
      expect(query).toMatch(/sr\.body_site_concept_id/);
      expect(params[params.length - 1]).toBe('mano');
    });

    it('MCH-029 · sin fila en la ventana no hidrata ningún informe', async () => {
      const { detector, em, find, findOne } = build({
        reports: [report({ lifecycleStatusConceptId: CLIN.REPORT_FINAL })],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match).toBeNull();
      expect(find).not.toHaveBeenCalled();
      expect(findOne).not.toHaveBeenCalled();
    });

    it('finds a report released via diagnostics (current_released_version_id present)', async () => {
      const { detector, em } = build({
        reports: [report({ currentReleasedVersionId: 'version-1' })],
        versions: [version({ issuedAt: daysAgo(3) })],
        duplicateRows: [{ id: 'report-1' }],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match?.resultsAvailable).toBe(true);
      expect(match?.performedAt).toEqual(daysAgo(3));
    });

    it('finds a report released via clinical (lifecycle FINAL, no version)', async () => {
      const { detector, em } = build({
        reports: [report({ lifecycleStatusConceptId: CLIN.REPORT_FINAL })],
        duplicateRows: [{ id: 'report-1' }],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match).not.toBeNull();
      expect(match?.version).toBeNull();
    });

    it('MCH-029 · sin versión, performedAt es la creación del informe, nunca su última corrección', async () => {
      const createdAt = daysAgo(5);
      const { detector, em } = build({
        reports: [
          report({
            lifecycleStatusConceptId: CLIN.REPORT_FINAL,
            createdAt,
            updatedAt: NOW,
          }),
        ],
        duplicateRows: [{ id: 'report-1' }],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match?.performedAt).toEqual(createdAt);
    });

    it('MCH-029 · un informe leído de la base con la versión liberada en null no cuenta como liberado', async () => {
      const { detector, em } = build({
        reports: [
          report({
            lifecycleStatusConceptId: CLIN.REPORT_FINAL,
            currentReleasedVersionId: null,
            resultReleaseStatusConceptId: null,
          }),
        ],
        duplicateRows: [{ id: 'report-1' }],
      });
      const match = await detector.findDuplicate(em, PATIENT, CODE, 30, NOW);
      expect(match?.resultsAvailable).toBe(false);
      expect(match?.version).toBeNull();
    });
  });

  describe('describe', () => {
    it('computes daysAgo against the given reference date', async () => {
      const { detector, em } = build({
        concepts: [{ id: CODE, display: 'Abdominal ultrasound' }],
      });
      const match = {
        report: report(),
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
        report: report({ custodianTenantId: TENANT_A }),
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
        report: report({ custodianTenantId: TENANT_A }),
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
        report: report({ custodianTenantId: TENANT_A }),
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
        report: report(),
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
        report: report(),
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
        report: report({ custodianTenantId: TENANT_A }),
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
        report: report(),
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
        reports: [report({ lifecycleStatusConceptId: CLIN.REPORT_PARTIAL })],
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

    it('MCH-029 · cuenta como pendiente un parcial leído de la base (versión liberada en null)', async () => {
      const { detector, em } = build({
        reports: [
          report({
            lifecycleStatusConceptId: CLIN.REPORT_PARTIAL,
            currentReleasedVersionId: null,
            resultReleaseStatusConceptId: null,
          }),
        ],
      });
      await expect(
        detector.findPendingReport(em, PATIENT, CODE, 30, NOW),
      ).resolves.toBe(true);
    });

    it('MCH-029 · filtra la ventana por creación, no por última corrección', async () => {
      const { detector, em, find } = build({});
      await detector.findPendingReport(em, PATIENT, CODE, 30, NOW);
      expect(find.mock.calls[0][1]).toEqual({
        patientProfileId: PATIENT,
        codeConceptId: CODE,
        createdAt: { $gte: daysAgo(30) },
      });
    });

    it('returns false when the report is already final', async () => {
      const { detector, em } = build({
        reports: [report({ lifecycleStatusConceptId: CLIN.REPORT_FINAL })],
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
