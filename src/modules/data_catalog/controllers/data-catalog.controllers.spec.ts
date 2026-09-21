import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import {
  CATALOG_EDIT_ROLES,
  CATALOG_READ_ROLES,
  CATALOG_REVIEW_ROLES,
  CATALOG_SCAN_ROLES,
} from '../data-catalog.roles';
import { DataCatalogController } from './data-catalog.controller';
import { DataCatalogInternalController } from './data-catalog-internal.controller';

/** Roles declarados en cada handler de un controlador. */
function rolesByHandler(controller: new (...args: never[]) => object) {
  const proto = controller.prototype as Record<string, unknown>;
  return Object.fromEntries(
    Object.getOwnPropertyNames(proto)
      .filter(
        (name) => name !== 'constructor' && typeof proto[name] === 'function',
      )
      .map((name) => [
        name,
        Reflect.getMetadata(ROLES_KEY, proto[name] as object) as
          string[] | undefined,
      ]),
  );
}

describe('autorización del catálogo (deny-by-default)', () => {
  const admin = rolesByHandler(DataCatalogController);

  it('ninguna ruta de administración queda sin rol', () => {
    const unguarded = Object.entries(admin).filter(
      ([, roles]) => !roles?.length,
    );
    expect(unguarded).toEqual([]);
  });

  it('leer no concede editar, revisar ni escanear', () => {
    expect(admin.listObjects).toEqual([...CATALOG_READ_ROLES]);
    expect(admin.upsertObjectAnnotation).toEqual([...CATALOG_EDIT_ROLES]);
    expect(admin.review).toEqual([...CATALOG_REVIEW_ROLES]);
    expect(admin.requestScan).toEqual([...CATALOG_SCAN_ROLES]);
    // Un DPO revisa pero no redacta: la separación proponente/aprobador empieza en el rol.
    expect(CATALOG_EDIT_ROLES).not.toContain('DPO');
  });

  it('el plano de ejecución sólo lo alcanza la identidad de servicio', () => {
    expect(rolesByHandler(DataCatalogInternalController)).toEqual({
      runNext: ['SYSTEM'],
    });
  });
});
