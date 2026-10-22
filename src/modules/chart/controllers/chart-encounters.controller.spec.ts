import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ChartEncountersController } from './chart-encounters.controller';

const actor = { id: 'clin-1', roles: [] } as any;

describe('ChartEncountersController', () => {
  it('delega en el servicio y fija los headers del PDF (C.4)', async () => {
    const encounterPdfService = {
      render: mockFn().mockResolvedValue({
        buffer: Buffer.from('%PDF-bytes'),
        fileName: 'encuentro-enc1.pdf',
      }),
    };
    const controller = new ChartEncountersController(
      encounterPdfService as any,
    );
    const res = { setHeader: mockFn(), send: mockFn() } as any;

    await controller.getEncounterPdf('enc1', res, actor);

    expect(encounterPdfService.render).toHaveBeenCalledWith('enc1', actor);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'private, no-store',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/pdf',
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      "attachment; filename*=UTF-8''encuentro-enc1.pdf",
    );
    expect(res.send).toHaveBeenCalledWith(Buffer.from('%PDF-bytes'));
  });
});
