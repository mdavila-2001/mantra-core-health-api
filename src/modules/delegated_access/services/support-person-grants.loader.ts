import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { SupportGrantFacts } from '../domain';
import { SupportAccessRepository } from '../repositories';
import { toGrantFacts } from './support-grant-facts';

/** Una persona de apoyo con TODAS sus concesiones de la organización (vivas o no). */
export interface PersonGrants {
  /** Vínculo (asignación de usuario de organización). */
  readonly engagementId: string;
  /** Cuenta de la persona. */
  readonly userId: string;
  /** Plantilla de rol del vínculo. */
  readonly roleTemplateId?: string;
  /** Hechos de cada concesión (con su efecto, condiciones y átomos). */
  readonly grants: readonly SupportGrantFacts[];
}

/** Filtro de lectura. */
export interface PersonGrantsFilter {
  /** Solo esta persona. */
  readonly userId?: string;
  /** Solo estos vínculos. */
  readonly engagementIds?: readonly string[];
}

/**
 * Lee las concesiones de las personas de apoyo de una organización como hechos
 * de dominio (`SupportGrantFacts`), listas para SoD, guardarraíles y simulación.
 * Una sola consulta de vínculos, una de concesiones con acciones y una de
 * asignaciones de rol: no hay consultas por concesión.
 */
@Injectable()
export class SupportPersonGrantsLoader {
  /** @param access - Vínculos, concesiones y asignaciones de rol. */
  constructor(private readonly access: SupportAccessRepository) {}

  /**
   * Personas con sus concesiones.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param filter - Persona o vínculos concretos (opcional).
   * @returns Una entrada por vínculo, en orden estable.
   */
  async load(
    em: EntityManager,
    tenantId: string,
    filter: PersonGrantsFilter = {},
  ): Promise<PersonGrants[]> {
    const engagements = await this.access.findEngagements(em, {
      tenantId,
      ...(filter.userId ? { userId: filter.userId } : {}),
      ...(filter.engagementIds ? { ids: filter.engagementIds } : {}),
    });
    if (engagements.length === 0) return [];
    const grants = await this.access.findGrantsWithActions(
      em,
      engagements.map((e) => e.assignment.id),
    );
    const roles = await this.access.findRoleAssignments(
      em,
      grants
        .map((g) => g.grant.practitionerRoleAssignmentId)
        .filter((id): id is string => !!id),
    );
    return engagements
      .map((record) => ({
        engagementId: record.assignment.id,
        userId: record.userId,
        roleTemplateId: record.assignment.roleTemplateId,
        grants: grants
          .filter(
            (g) =>
              g.grant.organizationUserAssignmentId === record.assignment.id,
          )
          .map(({ grant, permissionIds, actions }) =>
            toGrantFacts(
              grant,
              permissionIds,
              grant.practitionerRoleAssignmentId
                ? roles.get(grant.practitionerRoleAssignmentId)
                    ?.practitionerProfileId
                : undefined,
              actions,
            ),
          ),
      }))
      .sort((a, b) => a.engagementId.localeCompare(b.engagementId));
  }
}
