import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartReadService } from './chart-read.service';
import { CHART } from '../chart.concepts';
import { FULL_READ_SCOPE as FULL } from '../../clinical/domain/clinical-read-scope';
import { ClinicalNoteHeaders } from '../entities';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const emFork = {};
  const em = { fork: mockFn(() => emFork) };
  const notesRepo = {
    findHeadersByPatient: mockFn().mockResolvedValue([]),
    findVersionsByIds: mockFn().mockResolvedValue(new Map()),
  };
  const carePlansRepo = {
    findPlansByPatient: mockFn().mockResolvedValue([]),
    findActivitiesForPlans: mockFn().mockResolvedValue([]),
  };
  const documentsRepo = {
    findRecordsByPatient: mockFn().mockResolvedValue([]),
    findFilesForRecords: mockFn().mockResolvedValue([]),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const scopeFilter = { build: mockFn().mockResolvedValue(null) };
  const scopeRepo = {
    page: mockFn().mockResolvedValue({ rows: [], hidden: 0 }),
  };
  const chartScopeRepo = {
    findNoteIdsAuthoredBy: mockFn().mockResolvedValue([]),
  };
  const service = new ChartReadService(
    em as any,
    notesRepo as any,
    carePlansRepo as any,
    documentsRepo as any,
    logger as any,
    scopeFilter as any,
    scopeRepo as any,
    chartScopeRepo as any,
  );
  return {
    service,
    notesRepo,
    carePlansRepo,
    documentsRepo,
    scopeFilter,
    scopeRepo,
    chartScopeRepo,
  };
}

function document(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc1',
    title: 'Radiografía',
    categoryConceptId: 'cat-1',
    statusConceptId: 'st-1',
    authorText: undefined,
    isExternal: false,
    documentDate: undefined,
    createdAt: new Date('2026-03-01T12:00:00.000Z'),
    ...overrides,
  } as any;
}

describe('ChartReadService', () => {
  describe('getPatientChart · documents[].files (D-4)', () => {
    it('agrupa los archivos de cada documento, ordenados por ordinal, con el rol traducido', async () => {
      const d = build();
      d.documentsRepo.findRecordsByPatient.mockResolvedValue([document()]);
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        {
          documentRecordId: 'doc1',
          fileId: 'f1',
          contentRoleConceptId: CHART.CONTENT_ROLE_PRIMARY,
          ordinal: 0,
        },
        {
          documentRecordId: 'doc1',
          fileId: 'f2',
          contentRoleConceptId: CHART.CONTENT_ROLE_ATTACHMENT,
          ordinal: 1,
        },
      ]);

      const chart = await d.service.getPatientChart('pat-1', 20, FULL);

      expect(chart.documents[0].files).toEqual([
        { fileId: 'f1', contentRole: 'PRIMARY', ordinal: 0 },
        { fileId: 'f2', contentRole: 'ATTACHMENT', ordinal: 1 },
      ]);
    });

    it('devuelve files: [] para un documento sin archivos', async () => {
      const d = build();
      d.documentsRepo.findRecordsByPatient.mockResolvedValue([document()]);
      d.documentsRepo.findFilesForRecords.mockResolvedValue([]);

      const chart = await d.service.getPatientChart('pat-1', 20, FULL);

      expect(chart.documents[0].files).toEqual([]);
    });

    it('no consulta findFilesForRecords si no hay documentos', async () => {
      const d = build();
      d.documentsRepo.findRecordsByPatient.mockResolvedValue([]);

      await d.service.getPatientChart('pat-1', 20, FULL);

      expect(d.documentsRepo.findFilesForRecords).toHaveBeenCalledWith(
        expect.anything(),
        [],
      );
    });
  });

  describe('getPatientChart · carePlans[].activities[].activityConceptId (BR-16/CL-26)', () => {
    it('expone la clase de actividad: se guarda al crear el plan y se perdía al releerlo', async () => {
      const d = build();
      d.carePlansRepo.findPlansByPatient.mockResolvedValue([
        {
          id: 'cp1',
          statusConceptId: CHART.CAREPLAN_ACTIVE,
          createdAt: new Date('2026-03-01T12:00:00.000Z'),
        },
      ]);
      d.carePlansRepo.findActivitiesForPlans.mockResolvedValue([
        {
          id: 'a1',
          carePlanId: 'cp1',
          activityConceptId: 'CPACT_STUDY',
          statusConceptId: CHART.ACTIVITY_SCHEDULED,
        },
      ]);

      const chart = await d.service.getPatientChart('pat-1', 20, FULL);

      expect(chart.carePlans[0].activities[0].activityConceptId).toBe(
        'CPACT_STUDY',
      );
    });
  });
  describe('getPatientChart · por alcance', () => {
    const SPECIALTIES = {
      kind: 'SPECIALTIES',
      specialtyConceptIds: ['esp-cardio'],
    } as const;
    const FILTER = { profileIds: ['hp-9'], userIds: ['u-9'], encounterIds: [] };

    it('con alcance completo lee por los repositorios de siempre y no informa lo oculto', async () => {
      const d = build();

      const chart = await d.service.getPatientChart('pat-1', 20, FULL);

      expect(d.scopeRepo.page).not.toHaveBeenCalled();
      expect(chart.hiddenByScope).toBeUndefined();
    });

    it('con especialidades filtra en SQL notas, planes y documentos y cuenta lo oculto', async () => {
      const d = build();
      d.scopeFilter.build.mockResolvedValue(FILTER);
      d.chartScopeRepo.findNoteIdsAuthoredBy.mockResolvedValue(['n1']);
      d.scopeRepo.page.mockResolvedValue({ rows: [], hidden: 3 });

      const chart = await d.service.getPatientChart('pat-1', 20, SPECIALTIES);

      expect(d.scopeFilter.build).toHaveBeenCalledWith(
        expect.anything(),
        'pat-1',
        SPECIALTIES,
      );
      expect(d.chartScopeRepo.findNoteIdsAuthoredBy).toHaveBeenCalledWith(
        expect.anything(),
        'pat-1',
        ['hp-9'],
      );
      expect(d.notesRepo.findHeadersByPatient).not.toHaveBeenCalled();
      const notes = d.scopeRepo.page.mock.calls.find(
        (call: any[]) => call[1].entity === ClinicalNoteHeaders,
      )[1];
      expect(notes.always).toEqual([{ id: { $in: ['n1'] } }]);
      expect(notes.limit).toBe(21);
      expect(chart.hiddenByScope).toEqual({
        notes: 3,
        carePlans: 3,
        documents: 3,
      });
    });

    it('sin notas de autores autorizados no agrega ninguna cláusula de visibilidad', async () => {
      const d = build();
      d.scopeFilter.build.mockResolvedValue(FILTER);

      await d.service.getPatientChart('pat-1', 20, SPECIALTIES);

      const notes = d.scopeRepo.page.mock.calls.find(
        (call: any[]) => call[1].entity === ClinicalNoteHeaders,
      )[1];
      expect(notes.always).toEqual([]);
    });
  });
});
