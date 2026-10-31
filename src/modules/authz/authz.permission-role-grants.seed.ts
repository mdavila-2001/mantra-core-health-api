import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, deterministicId } from '../../common/constants/concepts';
import { AUTHZ } from './authz.concepts';
import { PLATFORM_PERMISSION_SEED } from './authz.seed';
import { Permissions, RolePermissions, Roles } from './entities';

/** Ámbito declarado en la semilla → concepto de `authz`. */
const SCOPE_CONCEPT: Record<string, string> = {
  SELF: AUTHZ.SCOPE_SELF,
  BRANCH: AUTHZ.SCOPE_BRANCH,
  TENANT: AUTHZ.SCOPE_TENANT,
  GLOBAL: AUTHZ.SCOPE_GLOBAL,
};

/** Id determinista de la concesión de un permiso a un rol de sistema. */
export function rolePermissionSeedId(
  roleCode: string,
  permissionCode: string,
): string {
  return deterministicId(
    `seed:authz-role-permission:${roleCode}:${permissionCode}`,
  );
}

/** Qué hizo una pasada de concesión de permisos de sistema a roles. */
export interface RoleGrantsSeedResult {
  /** Concesiones nuevas en esta pasada. Una segunda corrida da 0. */
  inserted: number;
  /** Ya existían (activas, o revocadas a propósito por un administrador). */
  alreadyPresent: number;
  /** `rol:permiso` que se omitieron porque `authz.roles` no tiene una fila con ese código. */
  skippedMissingRole: string[];
}

/**
 * Concede `ALLOW` a los roles que la semilla declara (`grantToRoleCodes`) sobre cada permiso de
 * sistema, siguiendo el patrón de `authz.platform-roles.seed.ts`: ids deterministas, sólo inserta
 * lo que falta, no reescribe nada y respeta lo que un administrador haya decidido.
 *
 * - **Idempotente.** La clave natural es (rol, permiso): si existe cualquier concesión —activa o
 *   revocada— no se inserta otra. Una revocada es una decisión de un administrador y no se
 *   deshace en el siguiente arranque.
 * - **No inventa roles.** Un código sin fila en `authz.roles` se omite y se informa en
 *   `skippedMissingRole`. Es el caso de `SECURITY_ADMIN`, que es un rol global de `iam` y no tiene
 *   fila propia en `authz.roles` (el código está reservado: `ROLE_CODE_RESERVED`).
 * - **Requiere los permisos ya persistidos** (los siembra `AuthzPlatformPermissionsSeedService`
 *   justo antes): un permiso que no se encuentra por código se omite.
 *
 * Hace `flush` al terminar si insertó algo.
 */
export async function seedPermissionRoleGrants(
  em: EntityManager,
  now: Date = new Date(),
): Promise<RoleGrantsSeedResult> {
  const result: RoleGrantsSeedResult = {
    inserted: 0,
    alreadyPresent: 0,
    skippedMissingRole: [],
  };
  for (const seed of PLATFORM_PERMISSION_SEED) {
    if (!seed.grantToRoleCodes?.length) continue;
    const permission = await em.findOne(Permissions, { code: seed.code });
    if (!permission) continue;
    for (const roleCode of seed.grantToRoleCodes) {
      const role = await em.findOne(Roles, { code: roleCode });
      if (!role) {
        result.skippedMissingRole.push(`${roleCode}:${seed.code}`);
        continue;
      }
      const existing = await em.findOne(RolePermissions, {
        roleId: role.id,
        permissionId: permission.id,
      });
      if (existing) {
        result.alreadyPresent += 1;
        continue;
      }
      em.create(
        RolePermissions,
        {
          id: rolePermissionSeedId(roleCode, seed.code),
          roleId: role.id,
          permissionId: permission.id,
          effectConceptId: AUTHZ.EFFECT_ALLOW,
          scopeConceptId: SCOPE_CONCEPT[seed.scope],
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      result.inserted += 1;
    }
  }
  if (result.inserted > 0) await em.flush();
  return result;
}
