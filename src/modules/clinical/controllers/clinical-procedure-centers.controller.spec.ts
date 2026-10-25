import 'reflect-metadata';
import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ClinicalProcedureCentersController } from './clinical-procedure-centers.controller';

const actor = { id: 'user-1', roles: ['PATIENT'] } as any;

describe('ClinicalProcedureCentersController', () => {
  it('delega en el servicio con la sesión y el origen, sin id de paciente', async () => {
    const service = { findForOwnOrders: mockFn(() => Promise.resolve({})) };
    const controller = new ClinicalProcedureCentersController(service as any);
    const query = { lat: -16.5, lng: -68.1, limit: 5 };
    await controller.findOwn(actor, query);
    expect(service.findForOwnOrders).toHaveBeenCalledWith(actor, query);
  });

  it('cuelga de /clinical/me/procedure-centers y sólo deja entrar al paciente', () => {
    expect(
      Reflect.getMetadata('path', ClinicalProcedureCentersController),
    ).toBe('clinical/me/procedure-centers');
    const roles = Reflect.getMetadataKeys(ClinicalProcedureCentersController)
      .map((key) =>
        Reflect.getMetadata(key, ClinicalProcedureCentersController),
      )
      .find((value) => Array.isArray(value) && value.includes('PATIENT'));
    expect(roles).toEqual(['PATIENT']);
  });
});
