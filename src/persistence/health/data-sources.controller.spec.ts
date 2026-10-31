import 'reflect-metadata';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { DataSourcesController } from './data-sources.controller';

/** Roles que declara un handler con `@Roles(...)`. */
function rolesOf(handler: 'dataSources' | 'metrics') {
  const fn = (
    DataSourcesController.prototype as unknown as Record<string, object>
  )[handler];
  return Reflect.getMetadata(ROLES_KEY, fn) as string[] | undefined;
}

/**
 * El estado de las fuentes de datos describe cuántos pools hay, el papel de cada conexión y por
 * dónde se enruta cada módulo: topología interna. Es de la operación de la plataforma, no de
 * cualquier sesión autenticada.
 */
describe('DataSourcesController', () => {
  it.each(['dataSources', 'metrics'] as const)(
    '%s exige un rol de operación de la plataforma',
    (handler) => {
      expect(rolesOf(handler)).toEqual([
        'PLATFORM_ADMIN',
        'SRE',
        'SECURITY_ADMIN',
      ]);
    },
  );
});
