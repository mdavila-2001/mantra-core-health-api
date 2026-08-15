import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { Permissions } from '../../modules/authz/entities';
import { AUTHZ } from '../../modules/authz/authz.concepts';
import { PLATFORM_PERMISSION_SEED } from '../../modules/authz/authz.seed';
import { CONCEPTS } from '../constants/concepts';

/** Acción declarada en la semilla → concepto de `authz`. */
const ACTION_CONCEPT: Record<string, string> = {
  READ: AUTHZ.ACTION_READ,
  WRITE: AUTHZ.ACTION_WRITE,
  CREATE: AUTHZ.ACTION_CREATE,
  DELETE: AUTHZ.ACTION_DELETE,
  EXECUTE: AUTHZ.ACTION_EXECUTE,
  APPROVE: AUTHZ.ACTION_APPROVE,
};

/** Ámbito declarado en la semilla → concepto de `authz`. */
const SCOPE_CONCEPT: Record<string, string> = {
  SELF: AUTHZ.SCOPE_SELF,
  BRANCH: AUTHZ.SCOPE_BRANCH,
  TENANT: AUTHZ.SCOPE_TENANT,
  GLOBAL: AUTHZ.SCOPE_GLOBAL,
};

/**
 * Materializa los permisos de sistema en `authz.permissions`.
 *
 * Existe por la misma razón que {@link AuthzClinicalRolesSeedService}: un grant
 * exige una fila que nadie estaba creando. `authz.resource_scope_grants` —el
 * mecanismo con el que un paciente comparte **un** estudio con **un**
 * profesional por **un** plazo— referencia `permission_id`, y el único camino
 * para tener uno era que un `SECURITY_ADMIN` lo diera de alta a mano. Un flujo
 * de autoservicio no puede depender de eso.
 *
 * Idempotente por id determinista, y respetuoso de lo que ya exista por código:
 * si un administrador creó a mano un permiso con el mismo código, se conserva
 * el suyo en vez de romper el arranque con una violación de unicidad.
 */
@Injectable()
export class AuthzPlatformPermissionsSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al `EntityManager` raíz.
   * @param logger - Registro estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzPlatformPermissionsSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración lo invoquen
   * tras materializar el esquema.
   *
   * @returns Cuántas filas se insertaron en esta pasada.
   */
  async run(): Promise<{
    /** Cuántos permisos se insertaron en esta pasada. */
    inserted: number;
  }> {
    const em: EntityManager = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;

    for (const seed of PLATFORM_PERMISSION_SEED) {
      if (await em.findOne(Permissions, { id: seed.id })) continue;
      if (await em.findOne(Permissions, { code: seed.code })) continue;

      em.create(
        Permissions,
        {
          id: seed.id,
          code: seed.code,
          name: seed.name,
          resource: seed.resource,
          actionConceptId: ACTION_CONCEPT[seed.action],
          defaultScopeConceptId: SCOPE_CONCEPT[seed.scope],
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          // No se restringe por rol ni se concede directo a un usuario: el
          // único camino a este permiso es un grant sobre un recurso concreto,
          // que es justamente lo que lo hace acotado y temporal.
          isRoleRestricted: false,
          allowDirectUserGrant: false,
          isFieldLevel: false,
          isDangerous: false,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted += 1;
    }

    if (inserted > 0) {
      await em.flush();
      this.logger.info(
        { operation: 'seed.authz.permissions', inserted },
        'Permisos de plataforma sembrados',
      );
    }
    return { inserted };
  }
}
