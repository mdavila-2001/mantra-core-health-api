import { Injectable } from '@nestjs/common';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  FieldPermissions,
  PermissionCategories,
  Permissions,
  Roles,
} from '../../modules/authz/entities';
import { AUTHZ } from '../../modules/authz/authz.concepts';
import { AUD } from '../../modules/audit/audit.concepts';
import {
  PERMISSION_CATEGORY_SEED,
  PLATFORM_PERMISSION_SEED,
  SUPPORT_STAFF_FIELD_FLOOR,
  clinicalRoleId,
  type PermissionGovernanceSeed,
  type PlatformPermissionSeed,
} from '../../modules/authz/authz.seed';
import { RoleTemplates } from '../../modules/delegated_access/entities';
import { DELEG } from '../../modules/delegated_access/delegated_access.concepts';
import {
  SUPPORT_TEMPLATE_CODES,
  SUPPORT_TEMPLATE_DEFAULTS,
  SUPPORT_TEMPLATE_NAMES,
  platformTemplateId,
} from '../../modules/delegated_access/domain/support-actions';
import { CONCEPTS } from '../constants/concepts';
import { seedSupportGovernance } from './support-governance.seed';

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

/** Sensibilidad declarada en la semilla → concepto de `authz`. */
const SENSITIVITY_CONCEPT: Record<string, string> = {
  LOW: AUTHZ.SENSITIVITY_LOW,
  MEDIUM: AUTHZ.SENSITIVITY_MEDIUM,
  HIGH: AUTHZ.SENSITIVITY_HIGH,
  CRITICAL: AUTHZ.SENSITIVITY_CRITICAL,
};

/** Aprobación declarada en la semilla → concepto de `authz`. */
const APPROVAL_CONCEPT: Record<string, string> = {
  DOCTOR: AUTHZ.APPROVAL_DOCTOR,
  SECOND_APPROVER: AUTHZ.APPROVAL_SECOND_APPROVER,
};

/** Propósito de uso declarado en la semilla → concepto de `authz`. */
const PURPOSE_CONCEPT: Record<string, string> = {
  TREATMENT: AUTHZ.PURPOSE_TREATMENT,
  PAYMENT: AUTHZ.PURPOSE_PAYMENT,
  OPERATIONS: AUTHZ.PURPOSE_OPERATIONS,
};

/** Base legal declarada en la semilla → concepto de `audit`. */
const LEGAL_BASIS_CONCEPT: Record<string, string> = {
  TREATMENT: AUD.LEGAL_BASIS_TREATMENT,
  CONSENT: AUD.LEGAL_BASIS_CONSENT,
  LEGAL_OBLIGATION: AUD.LEGAL_BASIS_LEGAL_OBLIGATION,
  HEALTHCARE_OPERATIONS: AUD.LEGAL_BASIS_HEALTHCARE_OPERATIONS,
};

/** Las 7 columnas de gobierno de `authz.permissions` que declara la semilla (§7.2). */
function governanceColumns(g: PermissionGovernanceSeed): {
  sensitivityConceptId: string;
  requiresReason: boolean;
  requiresStepUp: boolean;
  approvalModeConceptId: string | undefined;
  purposeOfUseConceptId: string | undefined;
  legalBasisConceptId: string | undefined;
  touchesClinicalData: boolean;
  supportAssignable: boolean;
} {
  return {
    sensitivityConceptId: SENSITIVITY_CONCEPT[g.sensitivity],
    requiresReason: g.requiresReason,
    requiresStepUp: g.requiresStepUp,
    approvalModeConceptId: g.approvalMode
      ? APPROVAL_CONCEPT[g.approvalMode]
      : undefined,
    purposeOfUseConceptId: g.purposeOfUse
      ? PURPOSE_CONCEPT[g.purposeOfUse]
      : undefined,
    legalBasisConceptId: g.legalBasis
      ? LEGAL_BASIS_CONCEPT[g.legalBasis]
      : undefined,
    touchesClinicalData: g.touchesClinicalData,
    supportAssignable: g.supportAssignable,
  };
}

/**
 * Alinea una fila ya sembrada con el catálogo vigente: solo las columnas de
 * gobierno y, en los átomos, categoría, `is_dangerous` e `is_field_level` (el
 * parche v4.2.72 hace lo mismo con `ON CONFLICT DO UPDATE`). El nombre, el
 * ámbito y las demás columnas no se tocan: un cambio de un administrador sobrevive.
 *
 * @returns `true` si cambió algo.
 */
function alignWithSeed(
  row: Permissions,
  seed: PlatformPermissionSeed,
): boolean {
  if (!seed.governance) return false;
  const wanted: Record<string, unknown> = governanceColumns(seed.governance);
  if (seed.categoryCode) {
    wanted.categoryId = PERMISSION_CATEGORY_SEED.find(
      (c) => c.code === seed.categoryCode,
    )?.id;
    wanted.isDangerous = seed.dangerous ?? false;
    wanted.isFieldLevel = seed.fieldLevel ?? false;
  }
  let changed = false;
  const current = row as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(wanted)) {
    if ((current[key] ?? null) === (value ?? null)) continue;
    current[key] = value;
    changed = true;
  }
  if (changed) row.updatedAt = new Date();
  return changed;
}

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
    /** Cuántas filas se insertaron en esta pasada. */
    inserted: number;
    /** Cuántas filas ya sembradas se alinearon con el catálogo vigente. */
    updated: number;
  }> {
    const em: EntityManager = this.orm.em.fork();
    const now = new Date();
    let inserted = 0;
    let updated = 0;

    // Categorías de la pantalla de permisos (7, del catálogo de apoyo).
    const knownCategories = await em.find(PermissionCategories, {
      id: { $in: PERMISSION_CATEGORY_SEED.map((c) => c.id) },
    });
    const categoryIds = new Set(knownCategories.map((c) => c.id));
    const insertedBefore = inserted;
    for (const category of PERMISSION_CATEGORY_SEED) {
      if (categoryIds.has(category.id)) continue;
      em.create(
        PermissionCategories,
        {
          id: category.id,
          code: category.code,
          name: category.name,
          ordinal: category.ordinal,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted += 1;
    }
    // `permissions.category_id` es una FK sin relación mapeada en el ORM: el orden
    // del commit entre tablas no está garantizado, así que las categorías se
    // confirman antes de crear los permisos que las referencian (una base vacía
    // fallaba con `fk_permissions_category_id`).
    if (inserted > insertedBefore) await em.flush();

    // Una lectura por id y otra por código, no dos consultas por permiso.
    const byId = new Map(
      (
        await em.find(Permissions, {
          id: { $in: PLATFORM_PERMISSION_SEED.map((p) => p.id) },
        })
      ).map((row) => [row.id, row]),
    );
    const codesTaken = new Set(
      (
        await em.find(Permissions, {
          code: { $in: PLATFORM_PERMISSION_SEED.map((p) => p.code) },
        })
      ).map((row) => row.code),
    );

    for (const seed of PLATFORM_PERMISSION_SEED) {
      const existing = byId.get(seed.id);
      if (existing) {
        if (alignWithSeed(existing, seed)) updated += 1;
        continue;
      }
      // Un permiso creado a mano con el mismo código se respeta.
      if (codesTaken.has(seed.code)) continue;

      em.create(
        Permissions,
        {
          id: seed.id,
          code: seed.code,
          name: seed.name,
          resource: seed.resource,
          categoryId: seed.categoryCode
            ? PERMISSION_CATEGORY_SEED.find((c) => c.code === seed.categoryCode)
                ?.id
            : undefined,
          actionConceptId: ACTION_CONCEPT[seed.action],
          defaultScopeConceptId: SCOPE_CONCEPT[seed.scope],
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          // No se restringe por rol ni se concede directo a un usuario: el
          // único camino a este permiso es un grant sobre un recurso concreto
          // (o una concesión de apoyo), que es lo que lo hace acotado.
          isRoleRestricted: false,
          allowDirectUserGrant: false,
          isFieldLevel: seed.fieldLevel ?? false,
          isDangerous: seed.dangerous ?? false,
          ...(seed.governance ? governanceColumns(seed.governance) : {}),
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted += 1;
    }

    // Piso de campos de plataforma del rol de ejecución SUPPORT_STAFF (GP-3):
    // lo clínico no se lee ni se escribe. Necesita la fila del rol (la siembra
    // `AuthzClinicalRolesSeedService` antes que este paso).
    const supportRoleId = clinicalRoleId('SUPPORT_STAFF');
    if (await em.findOne(Roles, { id: supportRoleId })) {
      const floor = await em.find(FieldPermissions, { roleId: supportRoleId });
      const have = new Set(
        floor.map((f) => `${f.entity}\u0000${f.columnName}`),
      );
      for (const field of SUPPORT_STAFF_FIELD_FLOOR) {
        if (have.has(`${field.entity}\u0000${field.columnName}`)) continue;
        em.create(
          FieldPermissions,
          {
            id: field.id,
            roleId: supportRoleId,
            entity: field.entity,
            columnName: field.columnName,
            canRead: field.canRead,
            canWrite: field.canWrite,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        inserted += 1;
      }
    } else {
      this.logger.warn(
        { operation: 'seed.authz.permissions' },
        'El rol SUPPORT_STAFF no está materializado: se omite su piso de campos',
      );
    }

    // Plantillas de rol de apoyo de plataforma (sin organización): referencian
    // las acciones por código, así que van junto a los permisos.
    for (const code of SUPPORT_TEMPLATE_CODES) {
      const id = platformTemplateId(code);
      if (await em.findOne(RoleTemplates, { id })) continue;
      em.create(
        RoleTemplates,
        {
          id,
          code,
          name: SUPPORT_TEMPLATE_NAMES[code],
          defaultActionsJson: [...SUPPORT_TEMPLATE_DEFAULTS[code]],
          statusConceptId: DELEG.ROLE_TEMPLATE_ACTIVE,
          versionNumber: 1,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      inserted += 1;
    }

    // Gobierno de accesos de apoyo: reglas SoD de plataforma y plantillas v2.
    const governance = await seedSupportGovernance(em, now);
    inserted += governance.inserted;
    updated += governance.updated;

    if (inserted > 0 || updated > 0) {
      await em.flush();
      this.logger.info(
        { operation: 'seed.authz.permissions', inserted, updated },
        'Permisos, categorías, piso de campos y plantillas de plataforma sembrados',
      );
    }
    return { inserted, updated };
  }
}
