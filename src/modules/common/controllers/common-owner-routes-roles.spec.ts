import 'reflect-metadata';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { CommonAddressesController } from './common-addresses.controller';
import { CommonContactPointsController } from './common-contact-points.controller';
import { CommonIdentifiersController } from './common-identifiers.controller';

/** Roles que declara un handler con `@Roles(...)`, o `undefined` si no declara ninguno. */
function rolesOf(controller: { prototype: object }, handler: string) {
  const fn = (controller.prototype as Record<string, unknown>)[handler];
  return Reflect.getMetadata(ROLES_KEY, fn as object) as string[] | undefined;
}

/**
 * Las altas de dirección, contacto e identificador reciben `ownerType` y `ownerId` en el cuerpo
 * y los servicios no comprueban de quién es el dueño, y la verificación de un contacto acepta
 * cualquier código: con sólo sesión, cualquiera escribiría o daría por verificado el dato de
 * otra persona. Por eso son rutas administrativas.
 */
describe('rutas de Common que escriben sobre un dueño que viaja en el cuerpo', () => {
  it.each([
    [CommonAddressesController, 'create'],
    [CommonContactPointsController, 'create'],
    [CommonContactPointsController, 'verify'],
    [CommonIdentifiersController, 'create'],
  ] as const)('%p.%s exige SECURITY_ADMIN', (controller, handler) => {
    expect(rolesOf(controller, handler)).toEqual(['SECURITY_ADMIN']);
  });
});
