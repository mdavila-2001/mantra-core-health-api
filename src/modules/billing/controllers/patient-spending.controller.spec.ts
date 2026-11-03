import 'reflect-metadata';
import { jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { PatientSpendingController } from './patient-spending.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('PatientSpendingController', () => {
  it('publica GET /patient-spending/me sólo para PATIENT', () => {
    const roles: string[] =
      Reflect.getMetadata(ROLES_KEY, PatientSpendingController) ?? [];
    expect(roles).toEqual(['PATIENT']);
    expect(Reflect.getMetadata('path', PatientSpendingController)).toBe(
      'patient-spending',
    );
    const handler = Object.getOwnPropertyDescriptor(
      PatientSpendingController.prototype,
      'listMine',
    )?.value as object;
    expect(Reflect.getMetadata('path', handler)).toBe('me');
  });

  it('delega con el actor del token y la consulta, sin id de persona', async () => {
    const response = { currency: 'BOB', items: [] };
    const service = { listMine: mockFn().mockResolvedValue(response) };
    const controller = new PatientSpendingController(service as any);
    const actor = { id: 'u', roles: ['PATIENT'], patientProfileId: 'p' };
    const query = { from: '2026-01-01', to: '2026-10-26' };

    await expect(controller.listMine(actor as any, query)).resolves.toBe(
      response,
    );
    expect(service.listMine).toHaveBeenCalledWith(actor, query);
  });
});
