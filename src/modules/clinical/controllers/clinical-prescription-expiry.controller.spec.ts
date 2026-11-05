import { jest } from '@jest/globals';
import { ClinicalPrescriptionExpiryController } from './clinical-prescription-expiry.controller';
import { AUDITED_KEY } from '../../../common/audit-trail';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('ClinicalPrescriptionExpiryController', () => {
  it('delega el barrido con el actor y el tope del cuerpo', async () => {
    const result = {
      scanned: 1,
      notified: 1,
      suppressed: 0,
      failed: 0,
      skipped: false,
    };
    const service = { sweep: mockFn().mockResolvedValue(result) };
    const controller = new ClinicalPrescriptionExpiryController(service as any);
    const actor = { id: 'sys', roles: ['SYSTEM'] } as any;

    await expect(controller.sweep({ limit: 10 }, actor)).resolves.toBe(result);

    expect(service.sweep).toHaveBeenCalledWith(actor, 10);
  });

  it('sólo lo ejecuta una cuenta de servicio', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, ClinicalPrescriptionExpiryController),
    ).toEqual(['SYSTEM', 'SYSTEM_WORKER']);
  });

  it('la ruta es POST /clinical/internal/prescription-expiry-notices y sella su acción', () => {
    expect(
      Reflect.getMetadata('path', ClinicalPrescriptionExpiryController),
    ).toBe('clinical/internal');
    const handler: object = (
      ClinicalPrescriptionExpiryController.prototype as any
    ).sweep;
    expect(Reflect.getMetadata('path', handler)).toBe(
      'prescription-expiry-notices',
    );
    expect(Reflect.getMetadata(AUDITED_KEY, handler)).toEqual({
      action: 'PRESCRIPTION_EXPIRY_NOTICES_SWEPT',
      entity: 'medication_request',
    });
  });
});
