import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartMeReadService } from './chart-me-read.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CHART } from '../chart.concepts';

const titular = {
  id: 'user-1',
  roles: ['PATIENT'],
  patientProfileId: 'pat-1',
} as any;
const sinPerfil = { id: 'user-2', roles: ['PATIENT'] } as any;

function build() {
  const em: any = {};
  em.fork = mockFn(() => em);
  em.flush = mockFn().mockResolvedValue(undefined);
  const notesRepo = {
    findHeadersByPatient: mockFn().mockResolvedValue([]),
    findVersionsByIds: mockFn().mockResolvedValue(new Map()),
  };
  const documentsRepo = {
    findRecordsByPatient: mockFn().mockResolvedValue([]),
    findFilesForRecords: mockFn().mockResolvedValue([]),
    findRecordById: mockFn(),
  };
  const fileUpload = {
    downloadForAuthorizedContext: mockFn().mockResolvedValue({
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
      originalName: 'doc.pdf',
    }),
  };
  const dataAccessLogRepo = { record: mockFn(() => ({ id: 'dal-1' })) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ChartMeReadService(
    em as any,
    notesRepo as any,
    documentsRepo as any,
    fileUpload as any,
    dataAccessLogRepo as any,
    logger as any,
  );
  return {
    service,
    em,
    notesRepo,
    documentsRepo,
    fileUpload,
    dataAccessLogRepo,
  };
}

describe('ChartMeReadService (BR-15)', () => {
  describe('listMyNotes (CL-30)', () => {
    it('412 si la sesión no tiene perfil de paciente', async () => {
      const d = build();
      await expect(d.service.listMyNotes(sinPerfil, 50)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('sólo incluye notas con versión liberada; nunca un borrador ni una retenida', async () => {
      const d = build();
      d.notesRepo.findHeadersByPatient.mockResolvedValue([
        {
          id: 'h-released',
          patientReleaseStatusConceptId: CHART.RELEASE_RELEASED,
          currentReleasedVersionId: 'v-released',
          createdAt: new Date(),
        },
        {
          id: 'h-draft',
          patientReleaseStatusConceptId: CHART.RELEASE_NOT_RELEASED,
          currentReleasedVersionId: undefined,
          createdAt: new Date(),
        },
        {
          id: 'h-withheld',
          patientReleaseStatusConceptId: CHART.RELEASE_WITHHELD,
          currentReleasedVersionId: 'v-old-released-then-withheld',
          createdAt: new Date(),
        },
      ]);
      d.notesRepo.findVersionsByIds.mockResolvedValue(
        new Map([['v-released', { subjectiveText: 'texto liberado' }]]),
      );

      const res = await d.service.listMyNotes(titular, 50);

      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('h-released');
      expect(res.items[0].subjectiveText).toBe('texto liberado');
      expect(d.notesRepo.findVersionsByIds).toHaveBeenCalledWith(
        expect.anything(),
        ['v-released'],
      );
    });

    it('deja rastro en audit.data_access_log', async () => {
      const d = build();
      await d.service.listMyNotes(titular, 50);
      expect(d.dataAccessLogRepo.record).toHaveBeenCalledWith(
        d.em,
        expect.objectContaining({
          userId: titular.id,
          patientProfileId: 'pat-1',
          resourceType: 'PATIENT_RELEASED_NOTES',
        }),
      );
      expect(d.em.flush).toHaveBeenCalled();
    });
  });

  describe('listMyDocuments (CL-30)', () => {
    it('sólo incluye documentos visibles para el paciente', async () => {
      const d = build();
      d.documentsRepo.findRecordsByPatient.mockResolvedValue([
        {
          id: 'doc-visible',
          patientVisibilityConceptId: CHART.VISIBILITY_PATIENT_VISIBLE,
          createdAt: new Date(),
        },
        {
          id: 'doc-oculto',
          patientVisibilityConceptId: CHART.VISIBILITY_PROVIDER_ONLY,
          createdAt: new Date(),
        },
      ]);

      const res = await d.service.listMyDocuments(titular, 50);

      expect(res.items).toHaveLength(1);
      expect(res.items[0].id).toBe('doc-visible');
    });
  });

  describe('getMyDocumentFileContent (CL-30)', () => {
    it('404 si el documento no existe', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue(null);
      await expect(
        d.service.getMyDocumentFileContent('doc-x', 'file-x', titular),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('404 (mismo mensaje) si el documento es de otro paciente', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc-1',
        patientProfileId: 'otro-paciente',
        patientVisibilityConceptId: CHART.VISIBILITY_PATIENT_VISIBLE,
      });
      await expect(
        d.service.getMyDocumentFileContent('doc-1', 'file-1', titular),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('404 si el documento no es visible para el paciente', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc-1',
        patientProfileId: 'pat-1',
        patientVisibilityConceptId: CHART.VISIBILITY_PROVIDER_ONLY,
      });
      await expect(
        d.service.getMyDocumentFileContent('doc-1', 'file-1', titular),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('404 si el archivo no cuelga de ese documento', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc-1',
        patientProfileId: 'pat-1',
        patientVisibilityConceptId: CHART.VISIBILITY_PATIENT_VISIBLE,
      });
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        { fileId: 'otro-archivo' },
      ]);
      await expect(
        d.service.getMyDocumentFileContent('doc-1', 'file-1', titular),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('devuelve el contenido y deja rastro cuando todo coincide', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc-1',
        patientProfileId: 'pat-1',
        patientVisibilityConceptId: CHART.VISIBILITY_PATIENT_VISIBLE,
      });
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        { fileId: 'file-1' },
      ]);

      const res = await d.service.getMyDocumentFileContent(
        'doc-1',
        'file-1',
        titular,
      );

      expect(res.mimeType).toBe('application/pdf');
      expect(d.dataAccessLogRepo.record).toHaveBeenCalledWith(
        d.em,
        expect.objectContaining({
          resourceType: 'PATIENT_DOCUMENT_FILE',
          resourceId: 'doc-1',
        }),
      );
    });
  });
});
