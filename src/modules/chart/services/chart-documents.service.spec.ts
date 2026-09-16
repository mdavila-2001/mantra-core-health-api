import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartDocumentsService } from './chart-documents.service';
import { CHART } from '../chart.concepts';

const actor = { id: 'clin-1', roles: [] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const emFork = {};
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => emFork),
  };
  const documentsRepo = {
    createRecord: mockFn(),
    findRecordsByPatient: mockFn().mockResolvedValue([]),
    findRecordById: mockFn(),
    findFilesForRecords: mockFn().mockResolvedValue([]),
    findByEncounter: mockFn().mockResolvedValue([]),
    createFile: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const attachableFiles = {
    assertUsableBy: mockFn().mockResolvedValue({ file: {}, version: {} }),
  };
  const clinicalRead = {
    assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
  };
  const fileUpload = {
    downloadForAuthorizedContext: mockFn().mockResolvedValue({
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
      originalName: 'doc.pdf',
    }),
  };
  const service = new ChartDocumentsService(
    em as any,
    documentsRepo,
    logger as any,
    attachableFiles as any,
    clinicalRead as any,
    fileUpload as any,
  );
  return {
    service,
    tx,
    em,
    emFork,
    documentsRepo,
    attachableFiles,
    clinicalRead,
    fileUpload,
  };
}

describe('ChartDocumentsService', () => {
  describe('createDocument (UC-15-09)', () => {
    it('flushes the record before its files and defaults the first file to PRIMARY', async () => {
      const d = build();
      d.documentsRepo.createRecord.mockReturnValue({
        id: 'doc1',
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        createdAt: new Date(),
      });

      const res = await d.service.createDocument(
        {
          patientProfileId: 'p1',
          tenantId: 't1',
          title: 'Lab result',
          files: [
            { fileId: 'f1' },
            { fileId: 'f2', contentRole: 'ATTACHMENT' },
          ],
        } as any,
        actor,
      );

      expect(d.tx.flush).toHaveBeenCalledTimes(1);
      expect(res.fileCount).toBe(2);
      expect(d.documentsRepo.createFile).toHaveBeenNthCalledWith(
        1,
        d.tx,
        expect.objectContaining({
          fileId: 'f1',
          contentRoleConceptId: CHART.CONTENT_ROLE_PRIMARY,
          ordinal: 0,
        }),
      );
      expect(d.documentsRepo.createFile).toHaveBeenNthCalledWith(
        2,
        d.tx,
        expect.objectContaining({
          fileId: 'f2',
          contentRoleConceptId: CHART.CONTENT_ROLE_ATTACHMENT,
        }),
      );
    });

    it('creates a record with no files (fileCount 0) using default category/status', async () => {
      const d = build();
      d.documentsRepo.createRecord.mockReturnValue({
        id: 'doc2',
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        createdAt: new Date(),
      });

      const res = await d.service.createDocument(
        { patientProfileId: 'p1', tenantId: 't1', title: 'Note' },
        actor,
      );
      expect(res.fileCount).toBe(0);
      expect(d.documentsRepo.createFile).not.toHaveBeenCalled();
      expect(d.documentsRepo.createRecord).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          categoryConceptId: CHART.DOC_CATEGORY_GENERAL,
          statusConceptId: CHART.DOC_STATUS_ACTIVE,
        }),
      );
    });

    it('validates each file against AttachableFileService before creating the record', async () => {
      const d = build();
      d.documentsRepo.createRecord.mockReturnValue({
        id: 'doc1',
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        createdAt: new Date(),
      });

      await d.service.createDocument(
        {
          patientProfileId: 'p1',
          tenantId: 't1',
          title: 'Lab result',
          files: [{ fileId: 'f1' }, { fileId: 'f2' }],
        } as any,
        actor,
      );

      expect(d.attachableFiles.assertUsableBy).toHaveBeenCalledTimes(2);
      expect(d.attachableFiles.assertUsableBy).toHaveBeenNthCalledWith(
        1,
        d.tx,
        'f1',
        actor,
        expect.objectContaining({ operation: 'chart.document.create' }),
        expect.objectContaining({ subject: 'El archivo del documento' }),
      );
    });

    it('does not create the record when a file fails validation', async () => {
      const d = build();
      const error = new Error('rejected');
      d.attachableFiles.assertUsableBy.mockRejectedValue(error);

      await expect(
        d.service.createDocument(
          {
            patientProfileId: 'p1',
            tenantId: 't1',
            title: 'Lab result',
            files: [{ fileId: 'f1' }],
          } as any,
          actor,
        ),
      ).rejects.toThrow(error);

      expect(d.documentsRepo.createRecord).not.toHaveBeenCalled();
    });

    it('does not call assertUsableBy when there are no files', async () => {
      const d = build();
      d.documentsRepo.createRecord.mockReturnValue({
        id: 'doc3',
        statusConceptId: CHART.DOC_STATUS_ACTIVE,
        createdAt: new Date(),
      });

      await d.service.createDocument(
        { patientProfileId: 'p1', tenantId: 't1', title: 'Note' },
        actor,
      );

      expect(d.attachableFiles.assertUsableBy).not.toHaveBeenCalled();
    });
  });

  describe('getDocumentFileContent (D-5)', () => {
    it('returns 404 when the document does not exist', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue(null);

      await expect(
        d.service.getDocumentFileContent('doc1', 'f1', actor),
      ).rejects.toThrow(/no encontrado/);
      expect(d.clinicalRead.assertPuedeLeerHistoria).not.toHaveBeenCalled();
    });

    it('returns the same 404 when the file does not hang from that document', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc1',
        patientProfileId: 'pat-1',
      });
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        { documentRecordId: 'doc1', fileId: 'other-file' },
      ]);

      await expect(
        d.service.getDocumentFileContent('doc1', 'f1', actor),
      ).rejects.toThrow(/no encontrado/);
      expect(d.clinicalRead.assertPuedeLeerHistoria).not.toHaveBeenCalled();
    });

    it('does not download when the actor cannot read the patient chart', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc1',
        patientProfileId: 'pat-1',
      });
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        { documentRecordId: 'doc1', fileId: 'f1' },
      ]);
      const forbidden = new Error('forbidden');
      d.clinicalRead.assertPuedeLeerHistoria.mockRejectedValue(forbidden);

      await expect(
        d.service.getDocumentFileContent('doc1', 'f1', actor),
      ).rejects.toThrow(forbidden);
      expect(d.fileUpload.downloadForAuthorizedContext).not.toHaveBeenCalled();
    });

    it('downloads the bytes once the document, file and access all check out', async () => {
      const d = build();
      d.documentsRepo.findRecordById.mockResolvedValue({
        id: 'doc1',
        patientProfileId: 'pat-1',
      });
      d.documentsRepo.findFilesForRecords.mockResolvedValue([
        { documentRecordId: 'doc1', fileId: 'f1' },
      ]);

      const content = await d.service.getDocumentFileContent(
        'doc1',
        'f1',
        actor,
      );

      expect(d.clinicalRead.assertPuedeLeerHistoria).toHaveBeenCalledWith(
        'pat-1',
        actor,
      );
      expect(d.fileUpload.downloadForAuthorizedContext).toHaveBeenCalledWith(
        'f1',
        'chart.document.file.content',
      );
      expect(content.mimeType).toBe('application/pdf');
    });
  });
});
