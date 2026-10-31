import { jest } from '@jest/globals';
import { clinicalRoleId } from '../../modules/authz/authz.seed';
import {
  AuthzClinicalRolesSeedService,
  SYSTEM_ROLE_SEED,
} from './authz-clinical-roles-seed.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Servicio con un contexto de persistencia en memoria sin roles sembrados. */
function build() {
  const creadas: Record<string, any>[] = [];
  const em = {
    findOne: mockFn(() => Promise.resolve(null)),
    create: mockFn((_entity: unknown, data: Record<string, any>) => {
      creadas.push(data);
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn() };
  return {
    service: new AuthzClinicalRolesSeedService(orm as never, logger as never),
    creadas,
  };
}

describe('AuthzClinicalRolesSeedService: roles de ejecución no asignables', () => {
  it('siembra SUPPORT_STAFF como rol de sistema NO asignable y deja los demás asignables', async () => {
    const { service, creadas } = build();

    await service.run();

    const soporte = creadas.find((r) => r.code === 'SUPPORT_STAFF');
    expect(soporte).toMatchObject({
      id: clinicalRoleId('SUPPORT_STAFF'),
      isSystem: true,
      isAssignable: false,
    });
    const asignables = creadas.filter((r) => r.code !== 'SUPPORT_STAFF');
    expect(asignables.length).toBe(SYSTEM_ROLE_SEED.length - 1);
    for (const rol of asignables) expect(rol.isAssignable).toBe(true);
  });
});
