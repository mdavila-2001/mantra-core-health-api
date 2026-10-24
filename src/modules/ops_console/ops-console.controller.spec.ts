import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { OPS_READ_ROLES, OpsConsoleController } from './ops-console.controller';

describe('autorización de /admin/ops', () => {
  it('todos los handlers exigen los roles de operación', () => {
    const proto = OpsConsoleController.prototype as unknown as Record<
      string,
      object
    >;
    const handlers = Object.getOwnPropertyNames(proto).filter(
      (n) => n !== 'constructor',
    );
    expect(handlers.length).toBeGreaterThan(5);
    for (const handler of handlers) {
      expect(Reflect.getMetadata(ROLES_KEY, proto[handler])).toEqual([
        ...OPS_READ_ROLES,
      ]);
    }
  });
});
