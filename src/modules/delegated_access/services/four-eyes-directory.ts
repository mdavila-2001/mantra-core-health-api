import { Injectable, Optional } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PROF } from '../../profiles/profiles.concepts';
import { PersonAccountLinks } from '../../profiles/entities';
import {
  atomsOfGrant,
  isGrantLive,
  type AdminScope,
  type ApproverDirectory,
} from '../domain';
import { GovernanceQueriesRepository } from '../repositories/governance-queries.repository';
import { SupportAccessRepository } from '../repositories';
import { SupportAdminDirectory } from './support-admin-directory';
import { toGrantFacts } from './support-grant-facts';

/** Átomo cuya concesión define el alcance de un administrador delegado (jefe de servicio). */
export const ADMIN_SCOPE_ATOM = 'team.grants.assign';

/** Qué datos hacen falta para elegir aprobadores de un conjunto de solicitudes. */
export interface DirectoryHints {
  /** Asignaciones de rol de los doctores titulares de las agendas implicadas. */
  readonly practitionerRoleAssignmentIds?: readonly string[];
  /** Carga los alcances de los jefes de servicio (cuesta más consultas). */
  readonly wantServiceHeads?: boolean;
}

/**
 * Construye el directorio de aprobadores que consume `eligibleApprovers`
 * (CONTRATO-GOBIERNO §6.5 paso 2): administradores de seguridad con membresía
 * viva, cuentas de los doctores titulares y alcances de los jefes de servicio.
 * Se calcula AL DECIDIR (no al pedir). Solo lee; devuelve identificadores.
 */
@Injectable()
export class ApproverDirectoryBuilder {
  /**
   * @param queries - Lecturas agregadas de gobierno (administradores).
   * @param access - Vínculos, concesiones y asignaciones de rol.
   * @param admins - Función común de administración: el jefe de servicio solo cuenta con el vínculo vivo, sin `DENY` ni regla L1 (opcional en suites anteriores).
   */
  constructor(
    private readonly queries: GovernanceQueriesRepository,
    private readonly access: SupportAccessRepository,
    @Optional() private readonly admins?: SupportAdminDirectory,
  ) {}

  /**
   * Arma el directorio de la organización.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param hints - Qué doctores y alcances hacen falta.
   * @returns El directorio.
   */
  async build(
    em: EntityManager,
    tenantId: string,
    hints: DirectoryHints = {},
  ): Promise<ApproverDirectory> {
    const securityAdminUserIds = await this.queries.securityAdminUserIds(
      em,
      tenantId,
    );
    const doctorUserIds = await this.doctorAccounts(
      em,
      hints.practitionerRoleAssignmentIds ?? [],
    );
    const serviceHeadScopes = hints.wantServiceHeads
      ? await this.serviceHeadScopes(em, tenantId)
      : [];
    return { securityAdminUserIds, doctorUserIds, serviceHeadScopes };
  }

  /** Cuentas activas de los doctores dueños de esas asignaciones de rol. */
  private async doctorAccounts(
    em: EntityManager,
    roleAssignmentIds: readonly string[],
  ): Promise<string[]> {
    const ids = [...new Set(roleAssignmentIds.filter(Boolean))];
    if (ids.length === 0) return [];
    const roles = await this.access.findRoleAssignments(em, ids);
    const profileIds = [...roles.values()].map((r) => r.practitionerProfileId);
    if (profileIds.length === 0) return [];
    const links = await em.find(PersonAccountLinks, {
      personId: { $in: profileIds },
      statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
    });
    return [...new Set(links.map((l) => l.userId))].sort();
  }

  /** Alcance de cada administrador delegado: sus concesiones vivas con `team.grants.assign`. */
  private async serviceHeadScopes(
    em: EntityManager,
    tenantId: string,
  ): Promise<AdminScope[]> {
    if (this.admins) {
      return this.admins.adminScopes(
        em,
        tenantId,
        ADMIN_SCOPE_ATOM,
        new Date(),
      );
    }
    const engagements = await this.access.findEngagements(em, { tenantId });
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
    const userOf = new Map(engagements.map((e) => [e.assignment.id, e.userId]));
    const now = new Date();
    const out: AdminScope[] = [];
    for (const { grant, permissionIds, actions } of grants) {
      const userId = userOf.get(grant.organizationUserAssignmentId);
      if (!userId) continue;
      const facts = toGrantFacts(
        grant,
        permissionIds,
        grant.practitionerRoleAssignmentId
          ? roles.get(grant.practitionerRoleAssignmentId)?.practitionerProfileId
          : undefined,
        actions,
      );
      if (facts.effect === 'DENY' || !isGrantLive(facts, now)) continue;
      if (!atomsOfGrant(facts).includes(ADMIN_SCOPE_ATOM)) continue;
      out.push({ adminUserId: userId, target: facts });
    }
    return out;
  }
}
