import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PROF } from '../../profiles/profiles.concepts';
import { PersonAccountLinks } from '../../profiles/entities';
import {
  atomsOfGrant,
  escalationTargets,
  isGrantLive,
  resolveReviewer,
  selectCampaignItems,
  type AdminScope,
  type CampaignFilters,
  type CampaignScope,
  type CampaignSelection,
  type ReviewKind,
  type ReviewerContext,
  type ReviewerGrantFacts,
  type ReviewerKind,
  type ReviewerResolution,
} from '../domain';
import { GovernanceQueriesRepository } from '../repositories';
import type {
  GovernanceWorld,
  WorldEngagement,
  WorldGrant,
} from './governance-world';

/** Átomo cuya concesión hace de alguien un jefe de servicio o de piso. */
export const ADMIN_SCOPE_ATOM = 'team.grants.assign';

/** Hechos de la organización que la resolución de revisores necesita. */
export interface ReviewerFacts {
  /** Alcances de los administradores delegados vivos. */
  readonly adminScopes: readonly AdminScope[];
  /** Contexto sin el tipo de campaña. */
  readonly context: Omit<ReviewerContext, 'campaignKind'>;
}

/**
 * Resolución de revisores de una campaña (CONTRATO-GOBIERNO §6.2): carga los
 * hechos (administradores de seguridad, jefes de servicio por su concesión
 * `team.grants.assign`, la cuenta de cada doctor) y llama a las funciones puras
 * del dominio. Nunca devuelve a la persona revisada ni a quien otorgó o aprobó
 * la concesión (`SOD-GOV-02`).
 */
@Injectable()
export class ReviewerResolverService {
  /**
   * @param queries - Lecturas agregadas del gobierno.
   */
  constructor(private readonly queries: GovernanceQueriesRepository) {}

  /**
   * Alcances de los administradores delegados vivos del mundo: cada concesión
   * `ALLOW` viva con `team.grants.assign` de un vínculo activo.
   *
   * @param world - Hechos de la organización.
   * @returns Un alcance por concesión.
   */
  adminScopesOf(world: GovernanceWorld): AdminScope[] {
    const out: AdminScope[] = [];
    for (const e of world.engagements) {
      if (e.state !== 'ACTIVE') continue;
      for (const g of e.grants) {
        if (g.effect === 'DENY' || !isGrantLive(g, world.now)) continue;
        if (!atomsOfGrant(g).includes(ADMIN_SCOPE_ATOM)) continue;
        out.push({ adminUserId: e.subjectUserId, target: g });
      }
    }
    return out;
  }

  /**
   * Hechos para resolver revisores: administradores de seguridad, alcances de
   * los jefes de servicio y la cuenta de cada doctor de las concesiones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param world - Hechos de la organización.
   * @param ownerUserId - Responsable de la campaña; `null` = el sistema.
   * @returns Los hechos de resolución.
   */
  async factsFor(
    em: EntityManager,
    world: GovernanceWorld,
    ownerUserId?: string | null,
  ): Promise<ReviewerFacts> {
    const securityAdminUserIds = await this.queries.securityAdminUserIds(
      em,
      world.tenantId,
    );
    const practitioners = new Set<string>();
    for (const e of world.engagements) {
      for (const g of e.grants) {
        if (g.practitionerProfileId) practitioners.add(g.practitionerProfileId);
        if (g.practitionerRoleAssignmentId)
          practitioners.add(g.practitionerRoleAssignmentId);
        for (const row of g.snapshot?.rows ?? []) {
          if (row.practitionerProfileId)
            practitioners.add(row.practitionerProfileId);
          if (row.practitionerRoleAssignmentId)
            practitioners.add(row.practitionerRoleAssignmentId);
        }
      }
    }
    return {
      adminScopes: this.adminScopesOf(world),
      context: {
        campaignOwnerUserId: ownerUserId ?? null,
        securityAdminUserIds,
        doctorUserIdsByPractitioner: await this.doctorAccounts(em, [
          ...practitioners,
        ]),
      },
    };
  }

  /**
   * Selecciona los ítems de una campaña con su revisor (`selectCampaignItems`).
   *
   * @param world - Hechos de la organización.
   * @param facts - Hechos de resolución.
   * @param input - Tipo, alcance, filtros y los ítems que ya están abiertos.
   * @returns La selección, ordenada y sin depender del orden de entrada.
   */
  select(
    world: GovernanceWorld,
    facts: ReviewerFacts,
    input: {
      readonly kind: ReviewKind;
      readonly scope: CampaignScope;
      readonly filters?: CampaignFilters;
      readonly existingOpenItemKeys?: readonly string[];
    },
  ): CampaignSelection {
    return selectCampaignItems({
      kind: input.kind,
      scope: input.scope,
      filters: input.filters,
      engagements: world.engagements,
      adminScopes: facts.adminScopes,
      reviewerContext: facts.context,
      now: world.now,
      existingOpenItemKeys: input.existingOpenItemKeys,
    });
  }

  /**
   * Revisores de UNA concesión (o del vínculo si no se da concesión), con el
   * mismo criterio que al lanzar: sirve para decidir un ítem y para listar la
   * bandeja de un revisor.
   *
   * @param facts - Hechos de resolución.
   * @param engagement - Vínculo revisado.
   * @param grant - Concesión; ausente = ítem de vínculo.
   * @param kind - Tipo de campaña.
   * @returns La resolución.
   */
  resolve(
    facts: ReviewerFacts,
    engagement: WorldEngagement,
    grant: WorldGrant | undefined,
    kind: ReviewKind,
  ): ReviewerResolution {
    return resolveReviewer(
      grant ?? { targetKind: 'ALL' },
      facts.adminScopes,
      {
        subjectUserId: engagement.subjectUserId,
        supervisorUserId: engagement.supervisorUserId,
      },
      { ...facts.context, campaignKind: kind },
    );
  }

  /**
   * Revisores de las concesiones NUEVAS de un cambio de rol (campaña `MOVER`,
   * §6.1 punto 4): el doctor de la concesión si es de un solo doctor y tiene
   * cuenta; si no, el dueño de la cuenta; si no, el administrador de seguridad.
   * No hace falta el mundo completo: en `MOVER` no cuentan los jefes de servicio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param engagement - Persona que cambia de rol y dueño de su cuenta.
   * @param grants - Concesiones nuevas (con quién las otorgó, si se sabe).
   * @returns Una resolución por concesión, en el mismo orden.
   */
  async resolveForMove(
    em: EntityManager,
    tenantId: string,
    engagement: {
      readonly subjectUserId: string;
      readonly supervisorUserId?: string | null;
    },
    grants: readonly ReviewerGrantFacts[],
  ): Promise<ReviewerResolution[]> {
    const practitioners = new Set<string>();
    for (const g of grants) {
      if (g.practitionerProfileId) practitioners.add(g.practitionerProfileId);
      if (g.practitionerRoleAssignmentId)
        practitioners.add(g.practitionerRoleAssignmentId);
    }
    const context: ReviewerContext = {
      campaignKind: 'MOVER',
      campaignOwnerUserId: null,
      securityAdminUserIds: await this.queries.securityAdminUserIds(
        em,
        tenantId,
      ),
      doctorUserIdsByPractitioner: await this.doctorAccounts(em, [
        ...practitioners,
      ]),
    };
    return grants.map((g) =>
      resolveReviewer(
        g,
        [],
        {
          subjectUserId: engagement.subjectUserId,
          supervisorUserId: engagement.supervisorUserId,
        },
        context,
      ),
    );
  }

  /**
   * A quién sube un ítem que nadie decidió.
   *
   * @param current - Tipo de revisor actual.
   * @param facts - Hechos de resolución.
   * @param engagement - Vínculo revisado.
   * @param grant - Concesión; ausente = ítem de vínculo.
   * @param kind - Tipo de campaña.
   * @returns Los nuevos revisores.
   */
  escalate(
    current: ReviewerKind,
    facts: ReviewerFacts,
    engagement: WorldEngagement,
    grant: WorldGrant | undefined,
    kind: ReviewKind,
  ): ReviewerResolution {
    return escalationTargets(
      current,
      grant ?? { targetKind: 'ALL' },
      facts.adminScopes,
      {
        subjectUserId: engagement.subjectUserId,
        supervisorUserId: engagement.supervisorUserId,
      },
      { ...facts.context, campaignKind: kind },
    );
  }

  /** Cuenta de cada doctor por su perfil (la persona detrás del perfil) o por su asignación de rol. */
  private async doctorAccounts(
    em: EntityManager,
    practitionerIds: readonly string[],
  ): Promise<Record<string, string>> {
    if (practitionerIds.length === 0) return {};
    const links = await em.find(PersonAccountLinks, {
      personId: { $in: [...practitionerIds] },
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    return Object.fromEntries(links.map((l) => [l.personId, l.userId]));
  }
}
