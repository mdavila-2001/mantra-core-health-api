import { Injectable } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, type AuthenticatedUser } from '../../../common';
import { AUTHZ } from '../../authz/authz.concepts';
import {
  Roles,
  RolePermissions,
  UserPermissionGrants,
} from '../../authz/entities';
import { AuthzEffectiveRolesService } from '../../authz/services/authz-effective-roles.service';
import { ClinicalReadService } from '../../clinical/services/clinical-read.service';
import {
  CatalogConcepts,
  ValueSetMembers,
  ValueSetVersions,
} from '../../terminology/entities';
import {
  ViewAudienceGate,
  ViewFeatureFlags,
  ViewPatientAccess,
  ViewPermissionGate,
} from './view-access.ports';

/** Un permiso, en su ventana de vigencia, cuenta sólo si `now` cae dentro. */
function withinWindow(
  from: Date | undefined | null,
  to: Date | undefined | null,
  now: number,
): boolean {
  if (from && from.getTime() > now) return false;
  if (to && to.getTime() <= now) return false;
  return true;
}

/**
 * Filtro de ámbito de tenant de una fila de `authz` con `tenant_id` nulable: sólo
 * valen las globales (columna nula) y las del tenant activo. Es la misma regla
 * que `roleAuthorizesInTenant` aplica a los roles del token; sin tenant activo,
 * sólo las globales.
 */
function inTenantOrGlobal(tenantId: string | undefined): {
  $or: { tenantId: string | null }[];
} {
  return {
    $or: [{ tenantId: null }, ...(tenantId ? [{ tenantId }] : [])],
  };
}

/**
 * Permisos por rol y por excepción de usuario, con deny-overrides.
 *
 * Es el subconjunto del PDP de `authz` que necesita una vista (permiso por
 * `permission_id`): roles activos del usuario **en el tenant activo** (una
 * asignación acotada a otro tenant no cuenta), con la herencia de roles padre;
 * `role_permissions` y `user_permission_grants` vigentes. Un `DENY` en cualquier
 * eslabón gana sobre cualquier `ALLOW`.
 *
 * Los roles (directos y padres) deben estar activos y ser globales o del tenant
 * activo; la herencia se corta en el primer padre que no lo cumple. Una
 * excepción de usuario con `tenant_id` sólo vale en ese tenant; sin `tenant_id`
 * es global.
 */
@Injectable()
export class AuthzViewPermissionGate extends ViewPermissionGate {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param effectiveRoles - Roles activos del usuario con su ámbito.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly effectiveRoles: AuthzEffectiveRolesService,
  ) {
    super();
  }

  /** @inheritdoc */
  async holds(
    user: AuthenticatedUser,
    tenantId: string | undefined,
    permissionId: string,
  ): Promise<boolean> {
    const em = this.em.fork();
    const now = Date.now();

    const assignments = await this.effectiveRoles.scopedAssignmentsForUser(
      em,
      user.id,
    );
    const codes = [
      ...new Set(
        assignments
          .filter((a) => a.tenantId === undefined || a.tenantId === tenantId)
          .map((a) => a.code),
      ),
    ];

    let allow = false;
    let deny = false;

    if (codes.length > 0) {
      const direct = await em.find(Roles, {
        code: { $in: codes },
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        ...inTenantOrGlobal(tenantId),
      });
      const roleIds = new Set(direct.map((r) => r.id));
      // Herencia: los permisos del rol padre también cuentan.
      let frontier = direct;
      while (frontier.length > 0) {
        const parentIds = frontier
          .map((r) => r.parentRoleId)
          .filter((id): id is string => !!id && !roleIds.has(id));
        if (parentIds.length === 0) break;
        frontier = await em.find(Roles, {
          id: { $in: parentIds },
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          ...inTenantOrGlobal(tenantId),
        });
        for (const role of frontier) roleIds.add(role.id);
      }

      const rolePermissions =
        roleIds.size === 0
          ? []
          : await em.find(RolePermissions, {
              roleId: { $in: [...roleIds] },
              permissionId,
              stateConceptId: CONCEPTS.STATE_ACTIVE,
            });
      for (const binding of rolePermissions) {
        if (binding.effectConceptId === AUTHZ.EFFECT_DENY) deny = true;
        else if (binding.effectConceptId === AUTHZ.EFFECT_ALLOW) allow = true;
      }
    }

    const grants = await em.find(UserPermissionGrants, {
      userId: user.id,
      permissionId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      ...inTenantOrGlobal(tenantId),
    });
    for (const grant of grants) {
      if (!withinWindow(grant.validFrom, grant.validTo, now)) continue;
      if (grant.effectConceptId === AUTHZ.EFFECT_DENY) deny = true;
      else if (grant.effectConceptId === AUTHZ.EFFECT_ALLOW) allow = true;
    }

    return allow && !deny;
  }
}

/**
 * Audiencia de un portal: el conjunto de valores (`value_set`) cuyos códigos son
 * códigos de rol. El usuario pertenece a la audiencia si alguno de sus roles
 * está incluido en la versión vigente del conjunto.
 */
@Injectable()
export class TerminologyViewAudienceGate extends ViewAudienceGate {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {
    super();
  }

  /** @inheritdoc */
  async isInAudience(
    user: AuthenticatedUser,
    valueSetId: string,
  ): Promise<boolean> {
    if ((user.roles ?? []).length === 0) return false;
    const em = this.em.fork();
    const now = Date.now();

    const versions = (await em.find(ValueSetVersions, { valueSetId })).filter(
      (v) => withinWindow(v.validFrom, v.validTo, now),
    );
    if (versions.length === 0) return false;

    const members = await em.find(ValueSetMembers, {
      valueSetVersionId: { $in: versions.map((v) => v.id) },
      included: true,
    });
    if (members.length === 0) return false;

    const concepts = await em.find(CatalogConcepts, {
      id: { $in: [...new Set(members.map((m) => m.conceptId))] },
    });
    const audience = new Set(concepts.map((c) => c.code));
    return user.roles.some((role) => audience.has(role));
  }
}

/**
 * La API no tiene todavía un proveedor de feature flags: un flag declarado por
 * una ruta se trata como **apagado** (fail-closed). Cuando exista el proveedor,
 * se sustituye esta clase por la que lo consulte.
 */
@Injectable()
export class DisabledViewFeatureFlags extends ViewFeatureFlags {
  /** @inheritdoc */
  isEnabled(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

/**
 * Acceso a los datos de un paciente: se rige por la misma política de la
 * historia clínica (turno de hoy, relación asistencial, consentimiento).
 */
@Injectable()
export class ClinicalViewPatientAccess extends ViewPatientAccess {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param clinicalRead - Política de acceso a la historia clínica.
   */
  constructor(private readonly clinicalRead: ClinicalReadService) {
    super();
  }

  /** @inheritdoc */
  async canAccess(
    user: AuthenticatedUser,
    patientProfileId: string,
  ): Promise<boolean> {
    try {
      await this.clinicalRead.assertCanReadHistory(patientProfileId, user);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) return false;
      throw error;
    }
  }
}
