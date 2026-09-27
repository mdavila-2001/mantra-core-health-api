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
  const service = new ChartReadService(
    em as any,
    notesRepo as any,
    carePlansRepo as any,
    documentsRepo as any,
    logger as any,
  );
  return { service, notesRepo, carePlansRepo, documentsRepo };
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

      const chart = await d.service.getPatientChart('pat-1', 20);

      expect(chart.documents[0].files).toEqual([
        { fileId: 'f1', contentRole: 'PRIMARY', ordinal: 0 },
        { fileId: 'f2', contentRole: 'ATTACHMENT', ordinal: 1 },
      ]);
    });

    it('devuelve files: [] para un documento sin archivos', async () => {
      const d = build();
      d.documentsRepo.findRecordsByPatient.mockResolvedValue([document()]);
      d.documentsRepo.findFilesForRecords.mockResolvedValue([]);

      const chart = await d.service.getPatientChart('pat-1', 20);

      expect(chart.documents[0].files).toEqual([]);
    });

    it('no consulta findFilesForRecords si no hay documentos', async () => {
      const d = build();
      d.documentsRepo.findRecordsByPatient.mockResolvedValue([]);

      await d.service.getPatientChart('pat-1', 20);

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

      const chart = await d.service.getPatientChart('pat-1', 20);

      expect(chart.carePlans[0].activities[0].activityConceptId).toBe(
        'CPACT_STUDY',
      );
    });
  });

  describe('getPatientChart · notes[].entries (P39)', () => {
    it('devuelve las filas de la versión vigente y [] cuando no tiene', async () => {
      const d = build();
      const entries = [
        { label: 'Presión arterial', value: '120/80 mmHg' },
        { label: 'Peso', value: '70 kg' },
      ];
      const nota = (id: string, currentVersionId: string) => ({
        id,
        lifecycleStatusConceptId: CHART.NOTE_LIFECYCLE_DRAFT,
        currentVersionId,
        createdAt: new Date('2026-03-01T12:00:00.000Z'),
      });
      d.notesRepo.findHeadersByPatient.mockResolvedValue([
        nota('n1', 'v1'),
        nota('n2', 'v2'),
        nota('n3', 'v-missing'),
      ]);
      d.notesRepo.findVersionsByIds.mockResolvedValue(
        new Map([
          [
            'v1',
            {
              id: 'v1',
              versionNumber: 1,
              subjectiveText: 's',
              entriesJson: entries,
            },
          ],
          ['v2', { id: 'v2', versionNumber: 1, subjectiveText: 's' }],
        ]),
      );

      const chart = await d.service.getPatientChart('pat-1', 20);

      const porId = new Map(chart.notes.map((n) => [n.noteId, n]));
      expect(porId.get('n1')?.entries).toEqual(entries);
      expect(porId.get('n1')?.subjectiveText).toBe('s');
      expect(porId.get('n2')?.entries).toEqual([]);
      expect(porId.get('n3')?.entries).toEqual([]);
    });
  });
});
