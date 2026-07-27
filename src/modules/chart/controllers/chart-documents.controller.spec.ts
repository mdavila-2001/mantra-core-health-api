import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartDocumentsController } from './chart-documents.controller';

const actor = { id: 'clin-1', roles: [] } as any;

describe('ChartDocumentsController', () => {
  it('delegates createDocument (UC-15-09)', async () => {
    const documentsService = { createDocument: mockFn() };
    const controller = new ChartDocumentsController(documentsService as any);
    const dto = { patientProfileId: 'p1', tenantId: 't1', title: 'Doc' };
    await controller.createDocument(dto, actor);
    expect(documentsService.createDocument).toHaveBeenCalledWith(dto, actor);
  });
});
