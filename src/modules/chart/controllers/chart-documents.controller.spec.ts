import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
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

  it('sirve el archivo del documento con no-store (D-5)', async () => {
    const documentsService = {
      createDocument: mockFn(),
      getDocumentFileContent: mockFn().mockResolvedValue({
        buffer: Buffer.from('bytes'),
        mimeType: 'application/pdf',
        originalName: 'documento.pdf',
      }),
    };
    const controller = new ChartDocumentsController(documentsService as any);
    const res = { setHeader: mockFn(), send: mockFn() } as any;

    await controller.getDocumentFileContent('doc1', 'file1', res, actor);

    expect(documentsService.getDocumentFileContent).toHaveBeenCalledWith(
      'doc1',
      'file1',
      actor,
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.send).toHaveBeenCalledWith(Buffer.from('bytes'));
  });
});
