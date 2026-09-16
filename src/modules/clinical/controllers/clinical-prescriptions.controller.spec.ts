import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalPrescriptionsController } from './clinical-prescriptions.controller';

const actor = { id: 'user-1', roles: [] } as any;

describe('ClinicalPrescriptionsController', () => {
  it('delega en el servicio y fija los headers del PDF', async () => {
    const prescriptionPdfService = {
      render: mockFn().mockResolvedValue({
        buffer: Buffer.from('%PDF-bytes'),
        fileName: 'receta-req1.pdf',
      }),
    };
    const controller = new ClinicalPrescriptionsController(
      prescriptionPdfService as any,
    );
    const res = { setHeader: mockFn(), send: mockFn() } as any;

    await controller.getPrescriptionPdf('req1', res, actor);

    expect(prescriptionPdfService.render).toHaveBeenCalledWith('req1', actor);
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
      "attachment; filename*=UTF-8''receta-req1.pdf",
    );
    expect(res.send).toHaveBeenCalledWith(Buffer.from('%PDF-bytes'));
  });
});
