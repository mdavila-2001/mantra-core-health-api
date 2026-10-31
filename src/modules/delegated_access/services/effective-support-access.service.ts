import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  DelegatedPermissionSetItemsRepository,
  DelegatedPermissionSetsRepository,
  EffectiveSupportAccessRepository,
  PractitionerDelegateAssignmentsRepository,
  SupportAccessRepository,
  type EffectiveAccessRow,
  type GrantWithActions,
} from '../repositories';
import {
  deriveEffectiveRows,
  expandGrant,
  isEngagementLive,
  TARGET_CONSTRAINTS,
  type ExpandableGrant,
  type ExpansionStructure,
} from '../domain';
import { DIR } from '../../directory/directory.concepts';
import { DELEG } from '../delegated_access.concepts';
import type { AccessLookupResponseDto } from '../dto';
import { STATUS } from './concept-maps';
import {
  isAllowGrant,
  readSnapshot,
  supportActionInputsOfPermissionIds,
  TARGET_KIND_BY_CONCEPT,
} from './support-grant-facts';
import { ensureSupportAgendaSet } from './support-permission-set';

/** Resultado de recalcular el acceso efectivo de una organización. */
export interface EffectiveRefreshResult {
  /** Filas escritas en `effective_support_access`. */
  readonly rows: number;
  /** Delegaciones doctor ↔ persona abiertas (pendientes de aceptación). */
  readonly delegationsCreated: number;
}

/**
 * Mantiene `effective_support_access`, la tabla derivada de qué puede hacer
 * cada persona de apoyo con cada doctor, y abre las delegaciones pendientes de
 * aceptación para los doctores que sus permisos alcanzan. Se recalcula cuando
 * cambian permisos, estructura (espacios, horarios) o vínculos.
 */
@Injectable()
export class EffectiveSupportAccessService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param access - Lecturas de vínculos, permisos y estructura.
   * @param effective - Tabla derivada.
   * @param delegatesRepo - Delegaciones doctor ↔ persona.
   * @param setsRepo - Sets de permisos delegados.
   * @param itemsRepo - Ítems de set.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly effective: EffectiveSupportAccessRepository,
    private readonly delegatesRepo: PractitionerDelegateAssignmentsRepository,
    private readonly setsRepo: DelegatedPermissionSetsRepository,
    private readonly itemsRepo: DelegatedPermissionSetItemsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EffectiveSupportAccessService.name);
  }

  /**
   * Recalcula el acceso efectivo de una organización (o de una persona en ella).
   *
   * @param tenantId - Organización.
   * @param options - Persona a acotar, actor que dispara y transacción en curso.
   * @returns Filas escritas y delegaciones abiertas.
   */
  async refreshTenant(
    tenantId: string,
    options: { userId?: string; actorUserId?: string; tx?: EntityManager } = {},
  ): Promise<EffectiveRefreshResult> {
    const run = async (tx: EntityManager): Promise<EffectiveRefreshResult> => {
      const now = new Date();
      const all = await this.access.findEngagements(tx, {
        tenantId,
        userId: options.userId,
      });
      // Mismo criterio que la política: vínculo vigente, membresía activa y
      // recertificación al día (con la gracia de 15 días).
      const live = all.filter(
        (e) =>
          (!e.assignment.validFrom || e.assignment.validFrom <= now) &&
          (!e.assignment.validTo || e.assignment.validTo > now) &&
          isEngagementLive(
            {
              assignmentActive: e.assignment.statusConceptId === STATUS.ACTIVE,
              membershipActive:
                e.membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE,
              membershipEndDate: e.membershipEndDate,
              nextRecertificationAt: e.assignment.nextRecertificationAt,
            },
            now,
          ),
      );
      const roles = await this.access.findRoleAssignmentsOfTenant(tx, tenantId);
      const pairs = await this.access.findLocationPairs(
        tx,
        roles.map((r) => r.id),
        STATUS.ACTIVE,
        now,
      );
      const expansionStructure: ExpansionStructure = {
        roles: roles.map((r) => ({
          id: r.id,
          practitionerProfileId: r.practitionerProfileId,
          healthcareServiceId: r.healthcareServiceId,
        })),
        locationPairs: pairs,
      };

      const grants = await this.access.findGrantsWithActions(
        tx,
        live.map((e) => e.assignment.id),
      );
      const roleOfGrant = await this.access.findRoleAssignments(
        tx,
        grants
          .map((g) => g.grant.practitionerRoleAssignmentId)
          .filter((id): id is string => !!id),
      );

      const rows: EffectiveAccessRow[] = [];
      let delegationsCreated = 0;
      let setId: string | undefined;

      for (const engagement of live) {
        const own = grants.filter(
          (g) =>
            g.grant.organizationUserAssignmentId === engagement.assignment.id &&
            g.grant.statusConceptId === DELEG.SUPPORT_GRANT_ACTIVE &&
            // Una concesión DENY nunca se materializa como permiso.
            isAllowGrant(g.grant) &&
            (!g.grant.validTo || g.grant.validTo > now),
        );
        const expandable = await this.toExpandable(tx, own, roleOfGrant);

        const everyone = new Set(roles.map((r) => r.practitionerProfileId));
        const reachable = new Set(
          expandable.flatMap((g) =>
            expandGrant(g, expansionStructure, everyone).map(
              (r) => r.practitionerRoleAssignmentId,
            ),
          ),
        );
        const existing = await this.access.findDelegationsOfEngagements(tx, [
          engagement.assignment.id,
        ]);
        const known = new Set(existing.map((d) => d.practitionerProfileId));
        for (const roleId of reachable) {
          const role = roles.find((r) => r.id === roleId);
          if (!role || known.has(role.practitionerProfileId)) continue;
          setId ??= await ensureSupportAgendaSet(
            tx,
            this.setsRepo,
            this.itemsRepo,
            tenantId,
            options.actorUserId,
          );
          this.delegatesRepo.create(tx, {
            tenantId,
            practitionerRoleAssignmentId: role.id,
            delegateUserAssignmentId: engagement.assignment.id,
            delegatedPermissionSetId: setId,
            delegateRoleConceptId: DELEG.DELEGATE_ROLE_SECRETARY,
            maySignClinicalContent: false,
            validFrom: now,
            statusConceptId: STATUS.ACTIVE,
            actorUserId: options.actorUserId,
          });
          known.add(role.practitionerProfileId);
          delegationsCreated += 1;
        }
        await tx.flush();

        for (const grant of expandable) {
          const derived = deriveEffectiveRows({
            grantId: grant.grantId,
            targetKind: grant.targetKind,
            practitionerRoleAssignmentIds: roles
              .filter(
                (r) => r.practitionerProfileId === grant.practitionerProfileId,
              )
              .map((r) => r.id),
            healthcareServiceId: grant.healthcareServiceId,
            withinCareSpaceIds: grant.withinCareSpaceIds ?? [],
            expansionMode: grant.expansionMode,
            snapshot: grant.snapshot,
            actions: grant.actions,
          });
          for (const row of derived) {
            rows.push({ ...row, userId: engagement.userId, tenantId });
          }
        }
      }

      await this.effective.replace(
        tx,
        tenantId,
        options.userId ? [options.userId] : [],
        rows,
        now,
      );
      this.logger.info(
        {
          operation: 'delegated_access.effective.refresh',
          tenantId,
          rows: rows.length,
          delegationsCreated,
        },
        'Effective support access refreshed',
      );
      return { rows: rows.length, delegationsCreated };
    };
    return options.tx ? run(options.tx) : this.em.transactional(run);
  }

  /**
   * Qué acciones tendría cada persona de apoyo sobre un doctor si él la aceptara:
   * es lo que el doctor ve antes de aceptar.
   *
   * @param tenantId - Organización.
   * @param practitionerProfileId - Doctor.
   * @returns Mapa `persona → acciones` de sus permisos vigentes que alcanzan al doctor.
   */
  async previewForDoctor(
    tenantId: string,
    practitionerProfileId: string,
  ): Promise<Map<string, Set<string>>> {
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const live = (await this.access.findEngagements(tx, { tenantId })).filter(
      (e) =>
        e.assignment.statusConceptId === STATUS.ACTIVE &&
        (!e.assignment.validTo || e.assignment.validTo > now),
    );
    const roles = await this.access.findRoleAssignmentsOfTenant(tx, tenantId);
    const pairs = await this.access.findLocationPairs(
      tx,
      roles.map((r) => r.id),
      STATUS.ACTIVE,
      now,
    );
    const structure: ExpansionStructure = {
      roles: roles.map((r) => ({
        id: r.id,
        practitionerProfileId: r.practitionerProfileId,
        healthcareServiceId: r.healthcareServiceId,
      })),
      locationPairs: pairs,
    };
    const grants = await this.access.findGrantsWithActions(
      tx,
      live.map((e) => e.assignment.id),
    );
    const roleOfGrant = await this.access.findRoleAssignments(
      tx,
      grants
        .map((g) => g.grant.practitionerRoleAssignmentId)
        .filter((id): id is string => !!id),
    );
    const result = new Map<string, Set<string>>();
    for (const engagement of live) {
      const own = grants.filter(
        (g) =>
          g.grant.organizationUserAssignmentId === engagement.assignment.id &&
          g.grant.statusConceptId === DELEG.SUPPORT_GRANT_ACTIVE &&
          isAllowGrant(g.grant) &&
          (!g.grant.validTo || g.grant.validTo > now),
      );
      const expandable = await this.toExpandable(tx, own, roleOfGrant);
      const actions = new Set<string>();
      for (const grant of expandable) {
        for (const row of expandGrant(
          grant,
          structure,
          new Set([practitionerProfileId]),
        )) {
          actions.add(row.permissionCode);
        }
      }
      if (actions.size > 0) {
        const merged = result.get(engagement.userId) ?? new Set<string>();
        actions.forEach((a) => merged.add(a));
        result.set(engagement.userId, merged);
      }
    }
    return result;
  }

  /** Permisos con su ubicación resuelta, listos para expandir. */
  private async toExpandable(
    tx: EntityManager,
    own: readonly GrantWithActions[],
    roleOfGrant: Map<string, { practitionerProfileId: string }>,
  ): Promise<ExpandableGrant[]> {
    const expandable: ExpandableGrant[] = [];
    for (const { grant, permissionIds } of own) {
      const kind = TARGET_KIND_BY_CONCEPT[grant.targetKindConceptId];
      if (!kind) continue;
      const spaceConstraint = TARGET_CONSTRAINTS[kind].location;
      expandable.push({
        grantId: grant.id,
        targetKind: kind,
        practitionerProfileId: grant.practitionerRoleAssignmentId
          ? roleOfGrant.get(grant.practitionerRoleAssignmentId)
              ?.practitionerProfileId
          : undefined,
        healthcareServiceId: grant.healthcareServiceId,
        withinCareSpaceIds:
          spaceConstraint === 'SPECIFIC'
            ? await this.access.findCareSpaceIdsWithin(tx, grant)
            : undefined,
        expansionMode:
          grant.expansionModeConceptId === DELEG.SUPPORT_EXPANSION_FIXED
            ? 'FIXED'
            : 'DYNAMIC',
        snapshot: readSnapshot(grant.fixedSnapshotJson),
        actions: supportActionInputsOfPermissionIds(permissionIds),
      });
    }
    return expandable;
  }

  /**
   * Quién tiene acceso a un doctor, un servicio o una ubicación.
   *
   * @param tenantId - Organización activa.
   * @param query - Doctor, servicio o ubicación (uno de ellos).
   * @returns Las personas con acceso, con sus acciones y los permisos de origen.
   */
  async lookup(
    tenantId: string,
    query: { doctor?: string; service?: string; location?: string },
  ): Promise<AccessLookupResponseDto> {
    const tx = this.em.fork({ keepTransactionContext: true });
    const careSpaceIds = query.location
      ? await this.locationSpaces(tx, tenantId, query.location)
      : undefined;
    const found = await this.effective.find(
      tx,
      {
        tenantId,
        practitionerRoleAssignmentId: query.doctor,
        healthcareServiceId: query.service,
        careSpaceIds,
      },
      500,
    );
    const grouped = new Map<
      string,
      {
        userId: string;
        practitionerRoleAssignmentId?: string;
        actions: Set<string>;
        grantIds: Set<string>;
      }
    >();
    for (const row of found) {
      const key = `${row.userId}:${row.practitionerRoleAssignmentId ?? '*'}`;
      const entry = grouped.get(key) ?? {
        userId: row.userId,
        practitionerRoleAssignmentId: row.practitionerRoleAssignmentId,
        actions: new Set<string>(),
        grantIds: new Set<string>(),
      };
      entry.actions.add(row.permissionCode);
      entry.grantIds.add(row.grantId);
      grouped.set(key, entry);
    }
    const items = [...grouped.values()].map((e) => ({
      userId: e.userId,
      practitionerRoleAssignmentId: e.practitionerRoleAssignmentId,
      actions: [...e.actions].sort(),
      grantIds: [...e.grantIds].sort(),
    }));
    return { items, count: items.length };
  }

  /** Espacios que contiene la ubicación consultada (espacio o sede de la organización). */
  private async locationSpaces(
    tx: EntityManager,
    tenantId: string,
    location: string,
  ): Promise<string[]> {
    const sites = await this.access.tenantsOfSites(tx, [location]);
    if (sites.get(location) === tenantId) {
      return this.access.findCareSpaceIdsWithin(tx, {
        practiceSiteId: location,
      });
    }
    const spaces = await this.access.findCareSpaces(tx, [location]);
    if (spaces.get(location)?.tenantId !== tenantId) return [];
    return this.access.findCareSpaceIdsWithin(tx, { careSpaceId: location });
  }

  /**
   * Organizaciones con algún vínculo de apoyo, para el recálculo periódico.
   *
   * @returns Los ids de organización.
   */
  async tenantsWithEngagements(): Promise<string[]> {
    const tx = this.em.fork({ keepTransactionContext: true });
    const engagements = await this.access.findEngagements(tx, {});
    return [...new Set(engagements.map((e) => e.tenantId))];
  }
}
