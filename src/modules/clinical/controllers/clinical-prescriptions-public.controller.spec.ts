import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalPrescriptionsPublicController } from './clinical-prescriptions-public.controller';

describe('ClinicalPrescriptionsPublicController', () => {
  it('delega en PrescriptionPdfService.verify y devuelve el resultado sin tocarlo', async () => {
    const resultado = {
      id: 'req1',
      status: 'ISSUED' as const,
      issuedAt: new Date('2026-09-16T00:00:00.000Z'),
      contentHash: 'a'.repeat(64),
      prescriberLicense: null,
    };
    const prescriptionPdfService = {
      verify: mockFn().mockResolvedValue(resultado),
    };
    const controller = new ClinicalPrescriptionsPublicController(
      prescriptionPdfService as any,
    );

    const res = await controller.verify('req1');

    expect(prescriptionPdfService.verify).toHaveBeenCalledWith('req1');
    expect(res).toBe(resultado);
    // Sin PHI: ni nombre de paciente ni de medicamento en la respuesta.
    expect(res).not.toHaveProperty('patientName');
    expect(res).not.toHaveProperty('medicationConceptId');
  });
});
