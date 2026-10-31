import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TenantMemberships } from '../../directory/entities';
import { PRAC } from '../../practice/practice.concepts';
import { isRoleAssignmentCurrent } from '../domain';
import {
  CareSpaces,
  HealthcareServices,
  PracticeSites,
  Practices,
  PractitionerLocationAssignments,
  PractitionerRoleAssignments,
} from '../../practice/entities';
import {
  OrganizationUserAssignments,
  PractitionerDelegateAssignments,
  SupportGrantActions,
  SupportScopeGrants,
} from '../entities';

/** Un vínculo de apoyo con la membresía (persona y organización) que lo ancla. */
export interface EngagementRecord {
  /** Fila del vínculo. */
  readonly assignment: OrganizationUserAssignments;
  /** Organización del vínculo (la de su membresía). */
  readonly tenantId: string;
  /** Persona de apoyo (la de su membresía). */
  readonly userId: string;
  /** Estado de la membresía que ancla el vínculo. */
  readonly membershipStatusConceptId: string;
  /** Fin de la membresía, si lo tiene. */
  readonly membershipEndDate?: Date;
}

/** Filtro de la búsqueda de vínculos de apoyo. */
export interface EngagementFilter {
  /** Solo los de esta persona. */
  readonly userId?: string;
  /** Solo los de esta organización. */
  readonly tenantId?: string;
  /** Solo estos vínculos. */
  readonly ids?: readonly string[];
}

/** Doctor (asignación de rol) con su perfil y la organización que lo contiene. */
export interface RoleAssignmentInfo {
  /** Id de la asignación de rol. */
  readonly id: string;
  /** Perfil profesional del doctor. */
  readonly practitionerProfileId: string;
  /** Práctica a la que pertenece la asignación. */
  readonly practiceId: string;
  /** Sede de la asignación, si declara una. */
  readonly practiceSiteId?: string;
  /** Servicio de la asignación, si declara uno. */
  readonly healthcareServiceId?: string;
  /** Organización dueña de la práctica. */
  readonly tenantId: string;
}

/** Espacio de atención con su ruta materializada y su organización. */
export interface CareSpaceInfo {
  /** Id del espacio. */
  readonly id: string;
  /** Sede que contiene el espacio. */
  readonly practiceSiteId: string;
  /** Ruta materializada `/sede/edificio/piso/sala/`. */
  readonly locationPath?: string;
  /** Organización dueña de la sede. */
  readonly tenantId: string;
}

/** Servicio de la práctica con su organización. */
export interface ServiceInfo {
  /** Id del servicio. */
  readonly id: string;
  /** Práctica del servicio. */
  readonly practiceId: string;
  /** Organización dueña de la práctica. */
  readonly tenantId: string;
}

/** Acción vigente de un permiso con su condición propia (si la trae). */
export interface GrantActionRecord {
  /** Id de la fila de `authz.permissions` (alias o átomo). */
  readonly permissionId: string;
  /** Condición ABAC propia de la acción. */
  readonly conditionJson?: unknown;
  /** Versión del esquema de la condición. */
  readonly conditionSchemaVersion?: number | null;
  /** Siempre nula aquí: las reemplazadas no se leen. */
  readonly supersededAt: Date | null;
}

/** Permiso con las acciones que incluye. */
export interface GrantWithActions {
  /** Fila del permiso. */
  readonly grant: SupportScopeGrants;
  /** Ids de permiso (`authz.permissions`) de sus acciones vigentes. */
  readonly permissionIds: readonly string[];
  /** Las mismas acciones con su condición (`condition_json`) por átomo. */
  readonly actions: readonly GrantActionRecord[];
}

/**
 * Lecturas que necesita la política de acceso del personal de apoyo y la
 * resolución de objetivos (doctor, servicio, espacio) con su organización.
 * Stateless: cada método recibe el `EntityManager` activo.
 */
@Injectable()
export class SupportAccessRepository {
  /**
   * Vínculos de apoyo (los que tienen plantilla de rol) con su membresía.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param filter - Persona, organización o ids.
   * @returns Los vínculos con persona y organización resueltas.
   */
  async findEngagements(
    em: EntityManager,
    filter: EngagementFilter,
  ): Promise<EngagementRecord[]> {
    let assignments: OrganizationUserAssignments[];
    let memberships: TenantMemberships[];
    if (filter.ids) {
      if (filter.ids.length === 0) return [];
      assignments = await em.find(OrganizationUserAssignments, {
        id: { $in: [...filter.ids] },
        roleTemplateId: { $ne: null },
      });
      memberships = await em.find(TenantMemberships, {
        id: { $in: assignments.map((a) => a.tenantMembershipId) },
      });
    } else {
      memberships = await em.find(TenantMemberships, {
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.tenantId ? { tenantId: filter.tenantId } : {}),
      });
      if (memberships.length === 0) return [];
      assignments = await em.find(OrganizationUserAssignments, {
        tenantMembershipId: { $in: memberships.map((m) => m.id) },
        roleTemplateId: { $ne: null },
      });
    }
    const byId = new Map(memberships.map((m) => [m.id, m]));
    const records: EngagementRecord[] = [];
    for (const assignment of assignments) {
      const membership = byId.get(assignment.tenantMembershipId);
      if (!membership) continue;
      if (filter.tenantId && membership.tenantId !== filter.tenantId) continue;
      if (filter.userId && membership.userId !== filter.userId) continue;
      records.push({
        assignment,
        tenantId: membership.tenantId,
        userId: membership.userId,
        membershipStatusConceptId: membership.statusConceptId,
        membershipEndDate: membership.endDate,
      });
    }
    return records;
  }

  /**
   * Permisos de los vínculos, con las acciones VIGENTES de cada uno (las
   * reemplazadas por átomos, `superseded_at`, no se leen: una sola consulta
   * para todos los permisos, igual que antes) y la condición de cada acción.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param engagementIds - Vínculos.
   * @returns Los permisos, los ids de permiso de sus acciones y sus condiciones.
   */
  async findGrantsWithActions(
    em: EntityManager,
    engagementIds: readonly string[],
  ): Promise<GrantWithActions[]> {
    if (engagementIds.length === 0) return [];
    const grants = await em.find(SupportScopeGrants, {
      organizationUserAssignmentId: { $in: [...engagementIds] },
    });
    if (grants.length === 0) return [];
    const actions = await em.find(SupportGrantActions, {
      supportScopeGrantId: { $in: grants.map((g) => g.id) },
      supersededAt: null,
    });
    const byGrant = new Map<string, GrantActionRecord[]>();
    for (const action of actions) {
      const list = byGrant.get(action.supportScopeGrantId) ?? [];
      list.push({
        permissionId: action.permissionId,
        conditionJson: action.conditionJson,
        conditionSchemaVersion: action.conditionSchemaVersion,
        supersededAt: null,
      });
      byGrant.set(action.supportScopeGrantId, list);
    }
    return grants.map((grant) => {
      const own = byGrant.get(grant.id) ?? [];
      return {
        grant,
        permissionIds: own.map((a) => a.permissionId),
        actions: own,
      };
    });
  }

  /**
   * Delegaciones (doctor ↔ persona) de los vínculos, con el doctor resuelto.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param engagementIds - Vínculos.
   * @returns Cada delegación con el perfil de su doctor.
   */
  async findDelegationsOfEngagements(
    em: EntityManager,
    engagementIds: readonly string[],
  ): Promise<
    {
      /** Delegación. */
      delegate: PractitionerDelegateAssignments;
      /** Perfil del doctor de la delegación. */
      practitionerProfileId: string;
    }[]
  > {
    if (engagementIds.length === 0) return [];
    const delegates = await em.find(PractitionerDelegateAssignments, {
      delegateUserAssignmentId: { $in: [...engagementIds] },
    });
    const roles = await this.findRoleAssignments(
      em,
      delegates.map((d) => d.practitionerRoleAssignmentId),
    );
    return delegates.flatMap((delegate) => {
      const role = roles.get(delegate.practitionerRoleAssignmentId);
      return role
        ? [{ delegate, practitionerProfileId: role.practitionerProfileId }]
        : [];
    });
  }

  /**
   * Asignaciones de rol del doctor con su perfil y organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids de asignación de rol.
   * @returns Mapa `id → info`; las inexistentes no figuran.
   */
  async findRoleAssignments(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, RoleAssignmentInfo>> {
    const result = new Map<string, RoleAssignmentInfo>();
    if (ids.length === 0) return result;
    const roles = await em.find(PractitionerRoleAssignments, {
      id: { $in: [...new Set(ids)] },
    });
    const practices = await em.find(Practices, {
      id: { $in: [...new Set(roles.map((r) => r.practiceId))] },
    });
    const tenantOfPractice = new Map(practices.map((p) => [p.id, p.tenantId]));
    for (const role of roles) {
      const tenantId = tenantOfPractice.get(role.practiceId);
      if (!tenantId) continue;
      result.set(role.id, {
        id: role.id,
        practitionerProfileId: role.practitionerProfileId,
        practiceId: role.practiceId,
        practiceSiteId: role.practiceSiteId,
        healthcareServiceId: role.healthcareServiceId,
        tenantId,
      });
    }
    return result;
  }

  /**
   * Asignaciones de rol vigentes de una organización, para expandir «todos».
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Las asignaciones de rol de sus prácticas.
   */
  async findRoleAssignmentsOfTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<RoleAssignmentInfo[]> {
    const practices = await em.find(Practices, { tenantId });
    if (practices.length === 0) return [];
    const now = new Date();
    // Solo las asignaciones que rigen hoy: un doctor dado de baja o vencido ya
    // no es «doctor de la organización» para la política.
    const roles = (
      await em.find(PractitionerRoleAssignments, {
        practiceId: { $in: practices.map((p) => p.id) },
      })
    ).filter((role) =>
      isRoleAssignmentCurrent(
        {
          active: role.statusConceptId === PRAC.ROLE_ASSIGNMENT_ACTIVE,
          validFrom: role.validFrom,
          validTo: role.validTo,
        },
        now,
      ),
    );
    return roles.map((role) => ({
      id: role.id,
      practitionerProfileId: role.practitionerProfileId,
      practiceId: role.practiceId,
      practiceSiteId: role.practiceSiteId,
      healthcareServiceId: role.healthcareServiceId,
      tenantId,
    }));
  }

  /**
   * Espacios de atención con su ruta materializada y organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids de espacio.
   * @returns Mapa `id → info`; los inexistentes no figuran.
   */
  async findCareSpaces(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, CareSpaceInfo>> {
    const result = new Map<string, CareSpaceInfo>();
    if (ids.length === 0) return result;
    const spaces = await em.find(CareSpaces, {
      id: { $in: [...new Set(ids)] },
    });
    const tenantOfSite = await this.tenantsOfSites(
      em,
      spaces.map((s) => s.practiceSiteId),
    );
    for (const space of spaces) {
      const tenantId = tenantOfSite.get(space.practiceSiteId);
      if (!tenantId) continue;
      result.set(space.id, {
        id: space.id,
        practiceSiteId: space.practiceSiteId,
        locationPath: space.locationPath,
        tenantId,
      });
    }
    return result;
  }

  /**
   * Organización dueña de cada sede.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param siteIds - Ids de sede.
   * @returns Mapa `sede → organización`; las inexistentes no figuran.
   */
  async tenantsOfSites(
    em: EntityManager,
    siteIds: readonly string[],
  ): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (siteIds.length === 0) return result;
    const sites = await em.find(PracticeSites, {
      id: { $in: [...new Set(siteIds)] },
    });
    const practices = await em.find(Practices, {
      id: { $in: [...new Set(sites.map((s) => s.practiceId))] },
    });
    const tenantOfPractice = new Map(practices.map((p) => [p.id, p.tenantId]));
    for (const site of sites) {
      const tenantId = tenantOfPractice.get(site.practiceId);
      if (tenantId) result.set(site.id, tenantId);
    }
    return result;
  }

  /**
   * Servicios de la práctica con su organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Ids de servicio.
   * @returns Mapa `id → info`; los inexistentes no figuran.
   */
  async findServices(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, ServiceInfo>> {
    const result = new Map<string, ServiceInfo>();
    if (ids.length === 0) return result;
    const services = await em.find(HealthcareServices, {
      id: { $in: [...new Set(ids)] },
    });
    const practices = await em.find(Practices, {
      id: { $in: [...new Set(services.map((s) => s.practiceId))] },
    });
    const tenantOfPractice = new Map(practices.map((p) => [p.id, p.tenantId]));
    for (const service of services) {
      const tenantId = tenantOfPractice.get(service.practiceId);
      if (!tenantId) continue;
      result.set(service.id, {
        id: service.id,
        practiceId: service.practiceId,
        tenantId,
      });
    }
    return result;
  }

  /**
   * Servicios de una organización, para expandir «todos los servicios».
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Ids de servicio de sus prácticas.
   */
  async findServiceIdsOfTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<string[]> {
    const practices = await em.find(Practices, { tenantId });
    if (practices.length === 0) return [];
    const services = await em.find(HealthcareServices, {
      practiceId: { $in: practices.map((p) => p.id) },
    });
    return services.map((s) => s.id);
  }

  /**
   * Espacios dentro de una ubicación: el propio espacio y todos sus
   * descendientes (por la ruta materializada), o todos los de una sede.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param location - Espacio o sede que ancla la ubicación.
   * @returns Ids de los espacios contenidos.
   */
  async findCareSpaceIdsWithin(
    em: EntityManager,
    location: { careSpaceId?: string; practiceSiteId?: string },
  ): Promise<string[]> {
    if (location.practiceSiteId) {
      const spaces = await em.find(CareSpaces, {
        practiceSiteId: location.practiceSiteId,
      });
      return spaces.map((s) => s.id);
    }
    if (!location.careSpaceId) return [];
    const spaces = await em.find(CareSpaces, {
      $or: [
        { id: location.careSpaceId },
        { locationPath: { $like: `%/${location.careSpaceId}/%` } },
      ],
    });
    return spaces.map((s) => s.id);
  }

  /**
   * Todos los espacios de una organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @returns Ids de espacio de sus sedes.
   */
  async findCareSpaceIdsOfTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<string[]> {
    const practices = await em.find(Practices, { tenantId });
    if (practices.length === 0) return [];
    const sites = await em.find(PracticeSites, {
      practiceId: { $in: practices.map((p) => p.id) },
    });
    if (sites.length === 0) return [];
    const spaces = await em.find(CareSpaces, {
      practiceSiteId: { $in: sites.map((s) => s.id) },
    });
    return spaces.map((s) => s.id);
  }

  /**
   * Dónde atiende cada doctor: asignaciones doctor ↔ espacio vigentes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param roleAssignmentIds - Asignaciones de rol del doctor.
   * @param activeConceptId - Estado activo de la asignación.
   * @param now - Instante que acota la vigencia.
   * @returns Pares `(asignación de rol, espacio)` vigentes.
   */
  async findLocationPairs(
    em: EntityManager,
    roleAssignmentIds: readonly string[],
    activeConceptId: string,
    now: Date,
  ): Promise<{ practitionerRoleAssignmentId: string; careSpaceId: string }[]> {
    if (roleAssignmentIds.length === 0) return [];
    const rows = await em.find(PractitionerLocationAssignments, {
      practitionerRoleAssignmentId: { $in: [...roleAssignmentIds] },
      statusConceptId: activeConceptId,
    });
    return rows
      .filter(
        (r) =>
          (!r.validFrom || r.validFrom.getTime() <= now.getTime()) &&
          (!r.validTo || r.validTo.getTime() > now.getTime()),
      )
      .map((r) => ({
        practitionerRoleAssignmentId: r.practitionerRoleAssignmentId,
        careSpaceId: r.careSpaceId,
      }));
  }

  /**
   * Asignaciones de rol de un doctor (por su perfil) dentro de una organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Perfil del doctor.
   * @param tenantId - Organización.
   * @returns Sus asignaciones de rol en las prácticas de la organización.
   */
  async findRoleAssignmentsOfPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
    tenantId: string,
  ): Promise<RoleAssignmentInfo[]> {
    const all = await this.findRoleAssignmentsOfTenant(em, tenantId);
    return all.filter((r) => r.practitionerProfileId === practitionerProfileId);
  }

  /**
   * Asignaciones de rol de un doctor en cualquier organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Perfil del doctor.
   * @returns Sus asignaciones de rol con la organización de cada una.
   */
  async findRoleAssignmentsOfProfile(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<RoleAssignmentInfo[]> {
    const roles = await em.find(PractitionerRoleAssignments, {
      practitionerProfileId,
    });
    const info = await this.findRoleAssignments(
      em,
      roles.map((r) => r.id),
    );
    return [...info.values()];
  }
}
