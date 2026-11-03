import { jest } from '@jest/globals';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { MedicalCentersController } from './medical-centers.controller';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * El método del controlador tal como lo ve el framework, sin desligarlo de la instancia.
 *
 * @param name - Nombre del método.
 * @returns La función del prototipo.
 */
const handlerOf = (name: string): object =>
  Object.getOwnPropertyDescriptor(MedicalCentersController.prototype, name)!
    .value as object;

describe('MedicalCentersController', () => {
  const search = { search: mockFn() };
  const forMyOrders = { searchForOrders: mockFn() };
  const controller = new MedicalCentersController(
    search as any,
    forMyOrders as any,
  );
  const actor = { id: 'u1' } as any;

  it('delega search y searchForMyOrders', async () => {
    const q1 = { procedureConceptIds: ['a'] } as any;
    const q2 = { serviceRequestIds: ['o'] } as any;

    await controller.search(q1);
    await controller.searchForMyOrders(q2, actor);

    expect(search.search).toHaveBeenCalledWith(q1);
    expect(forMyOrders.searchForOrders).toHaveBeenCalledWith(q2, actor);
  });

  it('mapea search y search/for-my-orders', () => {
    expect(Reflect.getMetadata(PATH_METADATA, handlerOf('search'))).toBe(
      'search',
    );
    expect(
      Reflect.getMetadata(PATH_METADATA, handlerOf('searchForMyOrders')),
    ).toBe('search/for-my-orders');
    expect(Reflect.getMetadata(PATH_METADATA, MedicalCentersController)).toBe(
      'medical-centers',
    );
  });

  it('search es abierta como la de imagenología: sin @Roles', () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlerOf('search'))).toBeUndefined();
  });

  it('for-my-orders exige sesión de paciente', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlerOf('searchForMyOrders')),
    ).toEqual(['PATIENT']);
  });
});
