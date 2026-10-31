import { Injectable, Optional } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { DIR } from '../../directory/directory.concepts';
import { TenantMemberships } from '../../directory/entities';
import { DELEG } from '../delegated_access.concepts';
import { RoleTemplates } from '../entities';
import { UserGlobalRoles } from '../../iam/entities';
import {
  atomsOfGrant,
  isEngagementLive,
  isGrantLive,
  liveAdminAtoms,
  PERMISSION_ATOM_BY_ID,
  type AdminDenyRule,
  type AdminScope,
  type DelegationCeilingInput,
  type GrantTargetFacts,
  type OwnerCandidate,
  type SupportAtomCode,
} from '../domain';
import {
  GovernanceRulesRepository,
  SupportAccessRepository,
  SupportDirectoryRepository,
  type EngagementRecord,
} from '../repositories';
import { STATUS } from './concept-maps';
import { toGrantFacts } from './support-grant-facts';

/** Una concesión viva con su objetivo enriquecido y los átomos que da. */
export interface LiveGrantView {
  readonly grantId: string;
  readonly engagementId: string;
  /** Objetivo con perfil del doctor, ruta del espacio y sede resueltos. */
  readonly target: GrantTargetFacts;
  readonly atoms: readonly SupportAtomCode[];
  readonly effect: 'ALLOW' | 'DENY';
  readonly validFrom?: Date;
  readonly validTo?: Date;
  /** `delegationCeiling` que trae la concesión (solo la que da `team.grants.assign`). */
  readonly ceiling?: DelegationCeilingInput;
  /** Condición cruda de todo el permiso (para que un delegado no la afloje). */
  readonly rawCondition?: unknown;
  /** Condición cruda de cada átomo (átomo → condición), solo las que existen. */
  readonly rawActionConditions?: Readonly<Record<string, unknown>>;
}

/** Techo de una concesión `team.grants.assign` junto con el alcance que la acompaña. */
export interface AssignGrantScope {
  readonly target: GrantTargetFacts;
  readonly ceiling: DelegationCeilingInput;
}

/** Lo que un administrador delegado puede hacer en una organización. */
export interface DelegatedAdminContext {
  readonly userId: string;
  readonly tenantId: string;
  /** Vínculos vivos de la persona que dan algún átomo `team.*`. */
  readonly engagementIds: readonly string[];
  /** Todos los átomos `team.*` que tiene vivos. */
  readonly atoms: ReadonlySet<string>;
  /** Átomo → objetivos de las concesiones vivas que lo incluyen (su alcance). */
  readonly targets: ReadonlyMap<string, readonly GrantTargetFacts[]>;
  /** Una entrada por concesión viva con `team.grants.assign` (cada una con su techo). */
  readonly assignGrants: readonly AssignGrantScope[];
}

const ASSIGN_ATOM = 'team.grants.assign';

/**
 * Quién es quién en una organización para el gobierno de accesos: los
 * administradores de seguridad, los doctores, los administradores delegados con
 * su alcance y techo, y los candidatos a dueño de una cuenta. Solo lee.
 */
@Injectable()
export class SupportAdminDirectory {
  /**
   * @param access - Lecturas de vínculos, permisos y estructura.
   * @param directory - Membresías y persona de la cuenta.
   * @param rules - Reglas de la organización: `DENY_PERMISSION` recorta los átomos de administración (opcional en suites anteriores al gobierno).
   */
  constructor(
    private readonly access: SupportAccessRepository,
    private readonly directory: SupportDirectoryRepository,
    @Optional() private readonly rules?: GovernanceRulesRepository,
  ) {}

  /**
   * Administradores de seguridad de la organización: rol global activo y
   * membresía viva en ella (el rol por sí solo no acota nada).
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @returns Ids de usuario, ordenados.
   */
  async securityAdminUserIds(
    em: EntityManager,
    tenantId: string,
    now: Date = new Date(),
  ): Promise<string[]> {
    const live = await this.liveMembers(em, tenantId, undefined, now);
    if (live.size === 0) return [];
    const roles = await em.find(UserGlobalRoles, {
      userId: { $in: [...live] },
      roleConceptId: CONCEPTS.ROLE_SECURITY_ADMIN,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    return [...new Set(roles.map((r) => r.userId))]
      .filter((id) => live.has(id))
      .sort();
  }

  /**
   * ¿Es administrador de seguridad de la organización?
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @returns `true` si lo es.
   */
  async isSecurityAdmin(
    em: EntityManager,
    userId: string,
    tenantId: string,
    now: Date = new Date(),
  ): Promise<boolean> {
    return (await this.securityAdminUserIds(em, tenantId, now)).includes(
      userId,
    );
  }

  /**
   * ¿Tiene hoy el rol de plataforma `SUPERADMIN` activo? Lo usa quien revalida
   * a un solicitante que ya no está en la petición (N-2): `SUPERADMIN` actúa
   * sin membresía propia en la organización.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Persona.
   * @returns `true` si el rol está activo.
   */
  async isPlatformAdmin(em: EntityManager, userId: string): Promise<boolean> {
    const roles = await em.find(UserGlobalRoles, {
      userId,
      roleConceptId: CONCEPTS.ROLE_SUPERADMIN,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    return roles.length > 0;
  }

  /**
   * De estas personas, las que tienen membresía viva en la organización.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param userIds - Personas a comprobar.
   * @param now - Reloj.
   * @returns Las que están vivas.
   */
  async liveMemberUserIds(
    em: EntityManager,
    tenantId: string,
    userIds: readonly string[],
    now: Date = new Date(),
  ): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    return this.liveMembers(em, tenantId, userIds, now);
  }

  /**
   * ¿Es doctor de la organización? Perfil profesional con asignación de rol
   * vigente en ella y membresía viva.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @returns `true` si atiende en la organización.
   */
  async isOrgDoctor(
    em: EntityManager,
    userId: string,
    tenantId: string,
    now: Date = new Date(),
  ): Promise<boolean> {
    const profileId = await this.directory.findPractitionerProfileIdOfUser(
      em,
      userId,
    );
    if (!profileId) return false;
    const roles = await this.access.findRoleAssignmentsOfPractitioner(
      em,
      profileId,
      tenantId,
    );
    if (roles.length === 0) return false;
    return (await this.liveMembers(em, tenantId, [userId], now)).has(userId);
  }

  /**
   * Concesiones vivas de los vínculos, con el objetivo enriquecido (doctor,
   * ruta del espacio, sede): lo que `targetWithin` necesita.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param records - Vínculos.
   * @param now - Reloj.
   * @returns Las concesiones vivas (con efecto `ALLOW` y `DENY`).
   */
  async liveGrantsOf(
    em: EntityManager,
    records: readonly EngagementRecord[],
    now: Date,
  ): Promise<LiveGrantView[]> {
    if (records.length === 0) return [];
    const withActions = await this.access.findGrantsWithActions(
      em,
      records.map((r) => r.assignment.id),
    );
    const roles = await this.access.findRoleAssignments(
      em,
      withActions
        .map((g) => g.grant.practitionerRoleAssignmentId)
        .filter((id): id is string => !!id),
    );
    const spaces = await this.access.findCareSpaces(
      em,
      withActions
        .map((g) => g.grant.careSpaceId)
        .filter((id): id is string => !!id),
    );
    const out: LiveGrantView[] = [];
    for (const { grant, permissionIds, actions } of withActions) {
      const profileId = grant.practitionerRoleAssignmentId
        ? roles.get(grant.practitionerRoleAssignmentId)?.practitionerProfileId
        : undefined;
      const facts = toGrantFacts(grant, permissionIds, profileId, actions);
      if (facts.unreadable || !isGrantLive(facts, now)) continue;
      const space = grant.careSpaceId
        ? spaces.get(grant.careSpaceId)
        : undefined;
      out.push({
        grantId: grant.id,
        engagementId: grant.organizationUserAssignmentId,
        target: {
          targetKind: facts.targetKind,
          expansionMode: facts.expansionMode,
          ...(facts.practitionerProfileId
            ? { practitionerProfileId: facts.practitionerProfileId }
            : {}),
          ...(grant.practitionerRoleAssignmentId
            ? {
                practitionerRoleAssignmentId:
                  grant.practitionerRoleAssignmentId,
              }
            : {}),
          ...(facts.healthcareServiceId
            ? { healthcareServiceId: facts.healthcareServiceId }
            : {}),
          ...(facts.careSpaceId ? { careSpaceId: facts.careSpaceId } : {}),
          ...(facts.practiceSiteId
            ? { practiceSiteId: facts.practiceSiteId }
            : {}),
          ...(space?.locationPath ? { careSpacePath: space.locationPath } : {}),
          ...(space ? { careSpaceSiteId: space.practiceSiteId } : {}),
          ...(facts.snapshot ? { snapshot: facts.snapshot } : {}),
        },
        atoms: atomsOfGrant(facts),
        effect: facts.effect ?? 'ALLOW',
        ...(facts.validFrom ? { validFrom: facts.validFrom } : {}),
        ...(facts.validTo ? { validTo: facts.validTo } : {}),
        // El techo de delegación solo se lee de la concesión viva que da el átomo.
        ...ceilingOf(facts),
        ...(grant.conditionJson ? { rawCondition: grant.conditionJson } : {}),
        ...rawActionConditionsOf(actions),
      });
    }
    return out;
  }

  /**
   * Alcance y techo de un administrador delegado en la organización: sus
   * concesiones `ALLOW` vivas con átomos `team.*` (tras las prohibiciones `DENY`
   * y las reglas `DENY_PERMISSION`, vía `liveAdminAtoms`) y, de
   * `team.grants.assign`, la condición `delegationCeiling` de cada una. `null`
   * si no administra nada.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @param now - Reloj.
   * @returns El contexto, o `null`.
   */
  async delegatedAdminOf(
    em: EntityManager,
    userId: string,
    tenantId: string,
    now: Date,
  ): Promise<DelegatedAdminContext | null> {
    const records = (
      await this.access.findEngagements(em, { userId, tenantId })
    ).filter((r) => this.isLive(r, now));
    if (records.length === 0) return null;
    const entries = (
      await this.liveAdminEntries(em, records, tenantId, now)
    ).flatMap((e) => e.entries);
    const atoms = new Set<string>();
    const targets = new Map<string, GrantTargetFacts[]>();
    const engagementIds = new Set<string>();
    const assignGrants: AssignGrantScope[] = [];
    for (const { ref: g, atoms: held } of entries) {
      const team = held.filter((a) => a.startsWith('team.'));
      if (team.length === 0) continue;
      engagementIds.add(g.engagementId);
      for (const atom of team) {
        atoms.add(atom);
        const list = targets.get(atom) ?? [];
        list.push(g.target);
        targets.set(atom, list);
      }
      if (team.includes(ASSIGN_ATOM)) {
        assignGrants.push({
          target: g.target,
          ceiling: g.ceiling ?? {},
        });
      }
    }
    if (atoms.size === 0) return null;
    return {
      userId,
      tenantId,
      engagementIds: [...engagementIds],
      atoms,
      targets,
      assignGrants,
    };
  }

  /**
   * Alcance de una persona para UN átomo de gobierno (`team.*`, `audit.*`…):
   * los objetivos de sus concesiones vivas que lo dan, con la MISMA función que
   * la administración delegada (vigencia del vínculo, `DENY`, reglas L1). Lo usan
   * las rutas de gobierno que comparten `SECURITY_ADMIN` con un delegado.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Persona.
   * @param tenantId - Organización.
   * @param atom - Átomo que exige la ruta.
   * @param now - Reloj.
   * @returns Los objetivos; vacío si no lo tiene hoy.
   */
  async governanceTargets(
    em: EntityManager,
    userId: string,
    tenantId: string,
    atom: string,
    now: Date,
  ): Promise<GrantTargetFacts[]> {
    const records = (
      await this.access.findEngagements(em, { userId, tenantId })
    ).filter((r) => this.isLive(r, now));
    if (records.length === 0) return [];
    return (await this.liveAdminEntries(em, records, tenantId, now))
      .flatMap((e) => e.entries)
      .filter((e) => e.atoms.includes(atom))
      .map((e) => e.ref.target);
  }

  /**
   * Alcance de TODOS los administradores de la organización para un átomo (los
   * jefes de servicio que pueden aprobar en cuatro ojos): solo vínculos vivos,
   * sin prohibiciones y sin reglas que les quiten el átomo.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param tenantId - Organización.
   * @param atom - Átomo que define el alcance (`team.grants.assign`).
   * @param now - Reloj.
   * @returns Un alcance por concesión viva.
   */
  async adminScopes(
    em: EntityManager,
    tenantId: string,
    atom: string,
    now: Date,
  ): Promise<AdminScope[]> {
    const records = (
      await this.access.findEngagements(em, { tenantId })
    ).filter((r) => this.isLive(r, now));
    const out: AdminScope[] = [];
    for (const { record, entries } of await this.liveAdminEntries(
      em,
      records,
      tenantId,
      now,
    )) {
      for (const e of entries) {
        if (e.atoms.includes(atom)) {
          out.push({ adminUserId: record.userId, target: e.ref.target });
        }
      }
    }
    return out;
  }

  /**
   * Candidato a dueño de una cuenta: hechos para `ownerEligibility` (D-07).
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Candidato.
   * @param tenantId - Organización.
   * @param now - Reloj.
   * @returns Los hechos del candidato.
   */
  async ownerCandidate(
    em: EntityManager,
    userId: string,
    tenantId: string,
    now: Date,
  ): Promise<OwnerCandidate> {
    const membershipLive = (
      await this.liveMembers(em, tenantId, [userId], now)
    ).has(userId);
    if (!membershipLive) {
      return {
        userId,
        membershipLive: false,
        isSecurityAdmin: false,
        isOrgDoctor: false,
        isLiveDelegatedAdmin: false,
      };
    }
    const [isSecurityAdmin, isOrgDoctor, admin] = await Promise.all([
      this.isSecurityAdmin(em, userId, tenantId, now),
      this.isOrgDoctor(em, userId, tenantId, now),
      this.delegatedAdminOf(em, userId, tenantId, now),
    ]);
    return {
      userId,
      membershipLive,
      isSecurityAdmin,
      isOrgDoctor,
      isLiveDelegatedAdmin: admin !== null,
    };
  }

  /**
   * Por vínculo vivo, las concesiones con átomos de administración que
   * sobreviven a las prohibiciones (UNA función: `liveAdminAtoms`).
   */
  private async liveAdminEntries(
    em: EntityManager,
    liveRecords: readonly EngagementRecord[],
    tenantId: string,
    now: Date,
  ): Promise<
    Array<{
      record: EngagementRecord;
      entries: Array<{ ref: LiveGrantView; atoms: string[] }>;
    }>
  > {
    if (liveRecords.length === 0) return [];
    const [views, codes, denyRules] = await Promise.all([
      this.liveGrantsOf(em, liveRecords, now),
      this.templateCodes(em, liveRecords),
      this.denyRules(em, tenantId, now),
    ]);
    return liveRecords.map((record) => ({
      record,
      entries: liveAdminAtoms({
        engagementLive: true,
        templateCode: record.assignment.roleTemplateId
          ? codes.get(record.assignment.roleTemplateId)
          : undefined,
        denyRules,
        grants: views
          .filter((g) => g.engagementId === record.assignment.id)
          .map((g) => ({
            ref: g,
            target: g.target,
            atoms: g.atoms,
            effect: g.effect,
            // `liveGrantsOf` ya descartó lo no vivo.
            live: true,
          })),
      }),
    }));
  }

  /** Reglas `DENY_PERMISSION` vivas de la organización. */
  private async denyRules(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<AdminDenyRule[]> {
    if (!this.rules) return [];
    const rows = await this.rules.findActiveForTenant(em, tenantId, now);
    return rows
      .filter((r) => r.ruleKindConceptId === DELEG.GOV_RULE_DENY_PERMISSION)
      .map((r) => ({
        roleTemplateCode: r.roleTemplateCode ?? null,
        permissionPattern: r.permissionPattern,
      }));
  }

  private async templateCodes(
    em: EntityManager,
    records: readonly EngagementRecord[],
  ): Promise<Map<string, string>> {
    const ids = [
      ...new Set(
        records
          .map((r) => r.assignment.roleTemplateId)
          .filter((id): id is string => !!id),
      ),
    ];
    if (ids.length === 0) return new Map();
    const rows = await em.find(RoleTemplates, { id: { $in: ids } });
    return new Map(rows.map((t) => [t.id, t.code]));
  }

  /** Personas con membresía activa y no terminada, opcionalmente solo entre `userIds`. */
  private async liveMembers(
    em: EntityManager,
    tenantId: string,
    userIds: readonly string[] | undefined,
    now: Date,
  ): Promise<Set<string>> {
    const rows = await em.find(TenantMemberships, {
      tenantId,
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
      ...(userIds ? { userId: { $in: [...userIds] } } : {}),
    });
    return new Set(
      rows
        .filter(
          (m) =>
            (!userIds || userIds.includes(m.userId)) &&
            (!m.endDate || m.endDate.getTime() > now.getTime()),
        )
        .map((m) => m.userId),
    );
  }

  /** ¿El vínculo rige ahora (activo, membresía viva, recertificación al día)? */
  private isLive(record: EngagementRecord, now: Date): boolean {
    const a = record.assignment;
    return isEngagementLive(
      {
        assignmentActive: a.statusConceptId === STATUS.ACTIVE,
        membershipActive:
          record.membershipStatusConceptId === DIR.MEMBERSHIP_ACTIVE,
        membershipEndDate: record.membershipEndDate,
        nextRecertificationAt: a.nextRecertificationAt,
        validFrom: a.validFrom,
        validTo: a.validTo,
      },
      now,
    );
  }
}

/** Condiciones crudas de las acciones que son átomos del catálogo (las de alias no las evalúa el motor). */
function rawActionConditionsOf(
  actions: ReadonlyArray<{
    permissionId: string;
    conditionJson?: unknown;
  }>,
): { rawActionConditions?: Record<string, unknown> } {
  const out: Record<string, unknown> = {};
  for (const row of actions) {
    if (!row.conditionJson) continue;
    const atom = PERMISSION_ATOM_BY_ID.get(row.permissionId);
    if (atom) out[atom.code] = row.conditionJson;
  }
  return Object.keys(out).length > 0 ? { rawActionConditions: out } : {};
}

/** `delegationCeiling` de `team.grants.assign`: el del átomo gana sobre el de la concesión. */
function ceilingOf(facts: ReturnType<typeof toGrantFacts>): {
  ceiling?: DelegationCeilingInput;
} {
  const own = facts.atomGrants?.find((a) => a.atom === ASSIGN_ATOM)?.condition
    ?.delegationCeiling;
  const whole = facts.condition?.delegationCeiling;
  const ceiling = own ?? whole;
  return ceiling ? { ceiling } : {};
}
