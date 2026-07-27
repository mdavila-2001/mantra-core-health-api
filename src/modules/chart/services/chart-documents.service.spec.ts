import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartDocumentsService } from './chart-documents.service';
import { CHART } from '../chart.concepts';

const actor = { id: 'clin-1', roles: [] } as any;

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const documentsRepo = { createRecord: mockFn(), createFile: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new ChartDocumentsService(
    em as any,
    documentsRepo,
    logger as any,
  );
  return { service, tx, documentsRepo };
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
  });
});
