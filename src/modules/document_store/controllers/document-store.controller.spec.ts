import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { DocumentStoreController } from './document-store.controller';

/** Roles declarados con `@Roles(...)` en un handler del controlador. */
function rolesOf(handler: keyof DocumentStoreController): unknown {
  return Reflect.getMetadata(
    ROLES_KEY,
    Reflect.get(DocumentStoreController.prototype, handler) as object,
  );
}

describe('DocumentStoreController (DOCSTORE-01)', () => {
  it.each(['create', 'findOne', 'list', 'update', 'softDelete'] as const)(
    '%s exige un rol de almacenamiento: ningún usuario autenticado del tenant lee o escribe por sí solo',
    (handler) => {
      expect(rolesOf(handler)).toEqual(['STORAGE_ADMIN', 'PLATFORM_ADMIN']);
    },
  );
});
