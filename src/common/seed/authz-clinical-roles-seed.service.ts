import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { Roles } from '../../modules/authz/entities';
import { AUTHZ } from '../../modules/authz/authz.concepts';
import { CLINICAL_ROLE_SEED } from '../../modules/authz/authz.seed';
import { PHARMA_LAB_ROLE_SEED } from '../../modules/pharma_lab/pharma_lab.roles';
import { SCHEDULING_ROLE_SEED } from '../../modules/scheduling/scheduling.roles';
import { CONCEPTS } from '../constants/concepts';

/**
 * Roles de sistema a materializar: los asistenciales del catálogo de actores más
 * los que cada módulo declara por su cuenta.
 *
 * Los módulos declaran sus roles en su propio archivo (`<modulo>.roles.ts`) y se
 * agregan acá, por el mismo motivo por el que los conceptos se agregan en
 * `module-concepts.ts`: que dos carriles puedan añadir roles en paralelo sin
 * editar el mismo archivo.
 */
const SYSTEM_ROLE_SEED = [
  ...CLINICAL_ROLE_SEED,
  ...PHARMA_LAB_ROLE_SEED,
  ...SCHEDULING_ROLE_SEED,
];

/** Rol base declarado en la semilla → concepto de `authz`. */
const BASE_ROLE_CONCEPT: Record<string, string> = {
  CLINICAL: AUTHZ.BASE_ROLE_CLINICAL,
  ADMIN: AUTHZ.BASE_ROLE_ADMIN,
  STAFF: AUTHZ.BASE_ROLE_STAFF,
};

/** Ámbito declarado en la semilla → concepto de `authz`. */
const SCOPE_CONCEPT: Record<string, string> = {
  SELF: AUTHZ.SCOPE_SELF,
  BRANCH: AUTHZ.SCOPE_BRANCH,
  TENANT: AUTHZ.SCOPE_TENANT,
  GLOBAL: AUTHZ.SCOPE_GLOBAL,
};

/**
 * Materializa los diez roles asistenciales de sistema en `authz.roles`.
 *
 * Sin estas filas no existe ningún rol clínico que asignar, y el claim `roles`
 * del token sólo puede contener los cuatro códigos de `iam.user_global_roles`
 * (`USER`, `PATIENT`, `SECURITY_ADMIN`, `SUPERADMIN`): todo endpoint marcado
 * `@Roles('CLINICIAN')`, `@Roles('SURGEON')`… quedaba fuera del alcance de
 * cualquier sujeto que no fuese `SUPERADMIN` por comodín.
 *
 * Idempotente por id determinista: sólo inserta lo que falta y no reescribe lo
 * existente, de modo que un cambio de nombre hecho por un administrador
 * sobrevive al siguiente arranque.
 */
@Injectable()
export class AuthzClinicalRolesSeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Valor de orm requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthzClinicalRolesSeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración lo invoquen
   * tras materializar el esquema.
   *
   * @returns Cuántas filas se insertaron en esta pasada.
   */
  async run(): Promise<{
    /** Cuántos roles se insertaron en esta pasada. */
    inserted: number;
  }> {
    const em: EntityManager = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;

    for (const seed of SYSTEM_ROLE_SEED) {
      if (await em.findOne(Roles, { id: seed.id })) continue;
      // El `code` es único en la tabla: si un administrador ya creó a mano un
      // rol con el mismo código, se respeta el suyo en vez de romper el arranque
      // con una violación de unicidad.
      if (await em.findOne(Roles, { code: seed.code })) continue;

      em.create(
        Roles,
        {
          id: seed.id,
          code: seed.code,
          name: seed.name,
          baseRoleConceptId: BASE_ROLE_CONCEPT[seed.baseRole],
          scopeConceptId: SCOPE_CONCEPT[seed.scope],
          isSystem: true,
          isAssignable: true,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted++;
    }

    await em.flush();

    if (inserted > 0) {
      this.logger.info({ inserted }, 'Roles de sistema sembrados');
    }
    return { inserted };
  }
}
