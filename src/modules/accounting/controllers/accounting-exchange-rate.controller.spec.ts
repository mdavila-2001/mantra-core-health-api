import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { AccountingExchangeRateController } from './accounting-exchange-rate.controller';

/** Roles exigidos por un handler del controlador. */
function roles(method: string): string[] | undefined {
  return Reflect.getMetadata(
    ROLES_KEY,
    (
      AccountingExchangeRateController.prototype as never as Record<
        string,
        object
      >
    )[method],
  );
}

describe('AccountingExchangeRateController · alcance (ACC-01)', () => {
  it('el registro de tipos de cambio es sólo de plataforma: SYSTEM (SUPERADMIN pasa por comodín)', () => {
    expect(roles('register')).toEqual(['SYSTEM']);
    expect(roles('register')).not.toContain('SECURITY_ADMIN');
  });
});
