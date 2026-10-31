import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ResourceNotFoundException,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  adjustmentOnlyReduces,
  checkDelegatedGrant,
  checkPeerAdmin,
  checkSelfAdmin,
  grantsOverlap,
  partitionByScope,
  targetAfterExpansionChange,
  targetWithin,
  type GrantTargetFacts,
  type SupportTargetKind,
  type TeamAdminOrgRule,
} from '../domain';
import { RoleTemplates } from '../entities';
import {
  GovernanceRulesRepository,
  SupportAccessRepository,
  type CareSpaceInfo,
  type EngagementRecord,
  type RoleAssignmentInfo,
} from '../repositories';
import { governanceError } from './governance-errors';
import {
  SupportAdminDirectory,
  type DelegatedAdminContext,
  type LiveGrantView,
} from './support-admin-directory';

/** Quien opera por `/org/team/*`: alcance total o el de un administrador delegado. */
export type TeamActor =
  | { readonly full: true; readonly userId: string }
  | {
      readonly full: false;
      readonly userId: string;
      readonly ctx: DelegatedAdminContext;
    };

/** Una persona del equipo tal como la ve quien administra. */
export interface ManagedMember {
  readonly record: EngagementRecord;
  readonly templateCode?: string;
  /** Todas sus concesiones vivas (solo para decidir; el delegado no las ve enteras). */
  readonly grants: readonly LiveGrantView[];
  /** Las que están dentro del alcance de quien administra. */
  readonly inScope: readonly LiveGrantView[];
  /** «Otras funciones de esta persona: N». */
  readonly outOfScopeCount: number;
}

/** Referencias de un ítem de solicitud o de una concesión propuesta. */
export interface TargetRefs {
  readonly targetKind: SupportTargetKind;
  readonly practitionerRoleAssignmentId?: string;
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly practiceSiteId?: string;
}

/** Lo que se propone otorgar, para comprobar alcance y techo. */
export interface CeilingCheckInput {
  readonly tenantId: string;
  readonly target: GrantTargetFacts;
  readonly atoms: readonly string[];
  readonly templateCode: string;
  readonly validTo?: Date;
  readonly now: Date;
}

/**
 * Política de administración delegada con techo (CONTRATO-GOBIERNO §6.4): quién
 * puede qué sobre quién. Autoriza el servicio, no el rol de borde: el átomo
 * `team.*` y su alcance salen de las concesiones VIVAS del delegado en ESA
 * organización, por eso uno de la organización A no opera en la B.
 */
@Injectable()
export class TeamAdminPolicy {
  /**
   * @param directory - Alcance y techo de los administradores delegados.
   * @param access - Lecturas de vínculos y estructura.
   * @param rules - Reglas de la organización que recortan el techo.
   */
  constructor(
    private readonly directory: SupportAdminDirectory,
    private readonly access: SupportAccessRepository,
    private readonly rules: GovernanceRulesRepository,
  ) {}

  /**
   * Quién opera y con qué átomo: `SECURITY_ADMIN` (alcance total) o un
   * administrador delegado vivo en esta organización que tenga el átomo.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param actor - Quien llama.
   * @param tenantId - Organización activa (la del contexto verificado).
   * @param atom - Átomo `team.*` que exige la operación.
   * @param now - Reloj.
   * @returns El alcance del actor.
   * @throws DomainException 403 `ADMIN_SCOPE_EXCEEDED` si no administra aquí, o
   *   `ADMIN_CEILING_EXCEEDED` si le falta el átomo.
   */
  async actorOf(
    em: EntityManager,
    actor: AuthenticatedUser,
    tenantId: string,
    atom: string | undefined,
    now: Date,
  ): Promise<TeamActor> {
    if (
      roleAuthorizesInTenant(actor, 'SECURITY_ADMIN', tenantId) ||
      roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)
    ) {
      return { full: true, userId: actor.id };
    }
    return this.delegatedActorOf(em, actor.id, tenantId, atom, now);
  }

  /**
   * Lo mismo que {@link actorOf} para alguien que NO está en la petición (N-2:
   * quien pidió un cambio que otra persona aprueba días después): se vuelve a
   * leer HOY si sigue siendo administrador de seguridad con membresía viva, de
   * plataforma o administrador delegado con el átomo, en lugar de confiar en
   * lo que era al pedir.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param userId - Quien pidió.
   * @param tenantId - Organización de la solicitud.
   * @param atom - Átomo `team.*` que exige la operación.
   * @param now - Reloj.
   * @returns El alcance de esa persona hoy.
   * @throws DomainException 403 `ADMIN_SCOPE_EXCEEDED` o `ADMIN_CEILING_EXCEEDED`.
   */
  async actorOfUser(
    em: EntityManager,
    userId: string,
    tenantId: string,
    atom: string | undefined,
    now: Date,
  ): Promise<TeamActor> {
    if (
      (await this.directory.isSecurityAdmin(em, userId, tenantId, now)) ||
      (await this.directory.isPlatformAdmin(em, userId))
    ) {
      return { full: true, userId };
    }
    return this.delegatedActorOf(em, userId, tenantId, atom, now);
  }

  private async delegatedActorOf(
    em: EntityManager,
    userId: string,
    tenantId: string,
    atom: string | undefined,
    now: Date,
  ): Promise<TeamActor> {
    const ctx = await this.directory.delegatedAdminOf(
      em,
      userId,
      tenantId,
      now,
    );
    if (!ctx) {
      throw governanceError(
        Reason.ADMIN_SCOPE_EXCEEDED,
        'Usted no administra el equipo de esta organización.',
      );
    }
    if (atom && !ctx.atoms.has(atom)) {
      throw governanceError(
        Reason.ADMIN_CEILING_EXCEEDED,
        'Su perfil no incluye este permiso de administración.',
      );
    }
    return { full: false, userId, ctx };
  }

  /**
   * Personas que puede administrar: las que tienen alguna concesión viva dentro
   * de su alcance (sin ella misma); quien ve todo, a todas.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param actor - Alcance del actor.
   * @param tenantId - Organización.
   * @param atom - Átomo que define el alcance consultado.
   * @param now - Reloj.
   * @returns La población, en orden estable.
   */
  async population(
    em: EntityManager,
    actor: TeamActor,
    tenantId: string,
    atom: string,
    now: Date,
  ): Promise<ManagedMember[]> {
    const records = (await this.access.findEngagements(em, { tenantId }))
      .filter((r) => r.userId !== actor.userId)
      .sort((a, b) => a.assignment.id.localeCompare(b.assignment.id));
    const grants = await this.directory.liveGrantsOf(em, records, now);
    const templates = await this.templateCodes(em, records);
    return records
      .map((r) => this.member(actor, atom, r, grants, templates, false))
      .filter((m): m is ManagedMember => !!m);
  }

  /**
   * Una persona administrable. Primero GP-6 (nadie administra lo propio); una
   * persona fuera de su alcance responde como inexistente (404 uniforme). Quien
   * aún no tiene ninguna concesión se admite solo si `allowUnscoped` (para dar la
   * primera, dentro de su alcance y techo).
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param actor - Alcance del actor.
   * @param tenantId - Organización.
   * @param engagementId - Vínculo de la persona.
   * @param atom - Átomo que define el alcance consultado.
   * @param now - Reloj.
   * @param allowUnscoped - Admite a quien no tiene concesiones vivas.
   * @returns La persona con su parte visible.
   */
  async memberOf(
    em: EntityManager,
    actor: TeamActor,
    tenantId: string,
    engagementId: string,
    atom: string,
    now: Date,
    allowUnscoped = false,
  ): Promise<ManagedMember> {
    const [record] = await this.access.findEngagements(em, {
      ids: [engagementId],
      tenantId,
    });
    if (!record) throw this.notFound();
    const self = checkSelfAdmin(actor.userId, record.userId);
    if (self) {
      throw governanceError(
        Reason.GUARDRAIL_SELF_ADMIN,
        'Nadie administra sus propios permisos.',
      );
    }
    const grants = await this.directory.liveGrantsOf(em, [record], now);
    const templates = await this.templateCodes(em, [record]);
    const found = this.member(
      actor,
      atom,
      record,
      grants,
      templates,
      allowUnscoped,
    );
    if (!found) throw this.notFound();
    return found;
  }

  /**
   * GP-6: un delegado no administra a otro delegado ni a un administrador de seguridad.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param actor - Alcance del actor.
   * @param member - Persona.
   * @param tenantId - Organización.
   * @param now - Reloj.
   * @throws DomainException 403 `GUARDRAIL_PEER_ADMIN`.
   */
  async assertNotPeer(
    em: EntityManager,
    actor: TeamActor,
    member: ManagedMember,
    tenantId: string,
    now: Date,
  ): Promise<void> {
    await this.assertUserNotPeer(
      em,
      actor,
      member.record.userId,
      tenantId,
      now,
    );
  }

  /**
   * GP-6 sobre una persona (no necesita su vínculo): sirve para quien PIDIÓ
   * una solicitud, que aún no tiene vínculo.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param actor - Alcance del actor.
   * @param userId - Persona sobre la que se actúa.
   * @param tenantId - Organización.
   * @param now - Reloj.
   * @throws DomainException 403 `GUARDRAIL_PEER_ADMIN`.
   */
  async assertUserNotPeer(
    em: EntityManager,
    actor: TeamActor,
    userId: string,
    tenantId: string,
    now: Date,
  ): Promise<void> {
    if (actor.full) return;
    const [admin, security] = await Promise.all([
      this.directory.delegatedAdminOf(em, userId, tenantId, now),
      this.directory.isSecurityAdmin(em, userId, tenantId, now),
    ]);
    const violation = checkPeerAdmin({
      subjectIsDelegatedAdmin: admin !== null,
      subjectIsSecurityAdmin: security,
      actorIsSecurityAdmin: false,
    });
    if (violation) {
      throw governanceError(
        Reason.GUARDRAIL_PEER_ADMIN,
        'No puede administrar a otro administrador ni a un administrador de seguridad.',
      );
    }
  }

  /**
   * Suspender, dar de baja o recertificar afecta a TODA la persona: todas sus
   * concesiones vivas deben estar dentro del alcance.
   *
   * @param actor - Alcance del actor.
   * @param member - Persona.
   * @throws DomainException 403 `ADMIN_SCOPE_EXCEEDED` con `outOfScope`.
   */
  assertWholePerson(actor: TeamActor, member: ManagedMember): void {
    if (actor.full || member.outOfScopeCount === 0) return;
    throw governanceError(
      Reason.ADMIN_SCOPE_EXCEEDED,
      'La persona tiene funciones fuera de su alcance. Puede quitarla de su servicio quitándole solo sus permisos.',
      { outOfScope: member.outOfScopeCount },
    );
  }

  /**
   * Quitar una concesión: basta con que se cruce con su alcance (una mixta se
   * puede quitar, no ampliar).
   *
   * @param actor - Alcance del actor.
   * @param member - Persona.
   * @param grantId - Concesión.
   * @param atom - Átomo del que sale el alcance (`team.grants.revoke`).
   * @returns La concesión.
   * @throws DomainException 404 si no es de la persona; 403 si no se cruza con su alcance.
   */
  assertRevocable(
    actor: TeamActor,
    member: ManagedMember,
    grantId: string,
    atom: string,
  ): LiveGrantView {
    const grant = member.grants.find((g) => g.grantId === grantId);
    if (!grant) {
      throw new ResourceNotFoundException(
        'Permiso no encontrado',
        undefined,
        Reason.SUPPORT_GRANT_NOT_FOUND,
      );
    }
    if (actor.full) return grant;
    // B-M1: una prohibición `DENY` es del administrador de seguridad; un delegado
    // no la quita ni la edita (el contrato no se lo concede).
    if (grant.effect === 'DENY') {
      throw governanceError(
        Reason.ADMIN_CEILING_EXCEEDED,
        'Las prohibiciones las gestiona un administrador de seguridad.',
        { breach: 'DENY_GRANT' },
      );
    }
    const targets = actor.ctx.targets.get(atom) ?? [];
    if (!targets.some((t) => grantsOverlap(grant.target, t))) {
      throw governanceError(
        Reason.ADMIN_SCOPE_EXCEEDED,
        'Ese permiso está fuera de su alcance.',
      );
    }
    return grant;
  }

  /**
   * El objetivo que tendrá la concesión DESPUÉS de editarla: el cambio de
   * `expansionMode` cambia lo que cubre (`FIXED` → `DYNAMIC` suelta la foto y el
   * permiso sigue a toda la organización), así que el alcance y el techo se
   * miden con este objetivo y no con el actual.
   *
   * @param grant - Concesión actual.
   * @param expansionMode - Modo pedido (si cambia).
   * @returns El objetivo resultante.
   */
  resultingTarget(
    grant: LiveGrantView,
    expansionMode: 'DYNAMIC' | 'FIXED' | undefined,
  ): GrantTargetFacts {
    return targetAfterExpansionChange(grant.target, expansionMode);
  }

  /**
   * B-M1: un delegado no quita ni afloja las condiciones que puso el
   * administrador. Lo que se reemplaza debe conservar cada clave existente y
   * solo puede AGREGAR restricciones (misma regla que el ajuste de una campaña).
   *
   * @param actor - Alcance del actor.
   * @param grant - Concesión actual.
   * @param change - Condiciones que quiere guardar.
   * @throws DomainException 403 `ADMIN_CEILING_EXCEEDED` con `breach: CONDITION_LOOSENED`.
   */
  assertConditionsNotLoosened(
    actor: TeamActor,
    grant: LiveGrantView,
    change: {
      readonly condition?: unknown;
      readonly actionConditions?: Readonly<Record<string, unknown>>;
    },
  ): void {
    if (actor.full) return;
    const loosened = (): never => {
      throw governanceError(
        Reason.ADMIN_CEILING_EXCEEDED,
        'No puede quitar ni aflojar las condiciones que puso el administrador.',
        { breach: 'CONDITION_LOOSENED' },
      );
    };
    const base = { atoms: grant.atoms, validTo: grant.validTo };
    if (
      change.condition !== undefined &&
      !adjustmentOnlyReduces(
        { ...base, condition: grant.rawCondition },
        { condition: change.condition },
      ).ok
    ) {
      loosened();
    }
    if (change.actionConditions !== undefined) {
      // El PATCH REEMPLAZA las condiciones de átomo: las que no vienen se borran.
      const atoms = new Set([
        ...Object.keys(grant.rawActionConditions ?? {}),
        ...Object.keys(change.actionConditions),
      ]);
      for (const atom of atoms) {
        const next = change.actionConditions[atom];
        if (
          !adjustmentOnlyReduces(
            { ...base, condition: grant.rawActionConditions?.[atom] },
            { condition: next === undefined ? null : next },
          ).ok
        ) {
          loosened();
        }
      }
    }
  }

  /**
   * Otorgar: el objetivo dentro de su alcance, la plantilla y los átomos dentro
   * de su techo efectivo y la vigencia dentro de `maxValidDays`. Fuera del techo
   * no hay aprobación que lo salte: lo hace un administrador de seguridad.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param actor - Alcance del actor.
   * @param input - Lo que se propone.
   * @throws DomainException 403 `ADMIN_SCOPE_EXCEEDED` o `ADMIN_CEILING_EXCEEDED`.
   */
  async assertGrantAllowed(
    em: EntityManager,
    actor: TeamActor,
    input: CeilingCheckInput,
  ): Promise<void> {
    if (actor.full) return;
    const orgRules = await this.orgRules(em, input.tenantId, input.now);
    let ceilingFailure: ReturnType<typeof checkDelegatedGrant> | undefined;
    for (const g of actor.ctx.assignGrants) {
      const verdict = checkDelegatedGrant({
        adminTargets: [g.target],
        ceiling: g.ceiling,
        subjectTemplateCode: input.templateCode,
        proposed: {
          target: input.target,
          atoms: input.atoms,
          validTo: input.validTo,
        },
        now: input.now,
        orgRules,
      });
      if (verdict.ok) return;
      if (verdict.code === 'ADMIN_CEILING_EXCEEDED') ceilingFailure ??= verdict;
    }
    if (ceilingFailure && !ceilingFailure.ok) {
      throw governanceError(
        Reason.ADMIN_CEILING_EXCEEDED,
        'Lo que propone supera el techo de lo que usted puede otorgar.',
        {
          breach: ceilingFailure.reason,
          ...(ceilingFailure.offendingAtoms
            ? { offendingAtoms: ceilingFailure.offendingAtoms }
            : {}),
          ...(ceilingFailure.maxValidDays !== undefined
            ? { maxValidDays: ceilingFailure.maxValidDays }
            : {}),
        },
      );
    }
    throw governanceError(
      Reason.ADMIN_SCOPE_EXCEEDED,
      'Lo que propone queda fuera de su alcance.',
    );
  }

  /**
   * Objetivo de un ítem de solicitud o de una concesión propuesta, enriquecido
   * con el perfil del doctor y la ruta del espacio.
   *
   * @param em - Contexto de lectura o transacción activa.
   * @param refs - Tipo y referencias.
   * @returns El objetivo listo para `targetWithin`.
   */
  async targetOf(
    em: EntityManager,
    refs: TargetRefs,
  ): Promise<GrantTargetFacts> {
    const roles = refs.practitionerRoleAssignmentId
      ? await this.access.findRoleAssignments(em, [
          refs.practitionerRoleAssignmentId,
        ])
      : new Map<string, RoleAssignmentInfo>();
    const spaces = refs.careSpaceId
      ? await this.access.findCareSpaces(em, [refs.careSpaceId])
      : new Map<string, CareSpaceInfo>();
    const profile = refs.practitionerRoleAssignmentId
      ? roles.get(refs.practitionerRoleAssignmentId)?.practitionerProfileId
      : undefined;
    const space = refs.careSpaceId ? spaces.get(refs.careSpaceId) : undefined;
    return {
      targetKind: refs.targetKind,
      expansionMode: 'DYNAMIC',
      ...(profile ? { practitionerProfileId: profile } : {}),
      ...(refs.practitionerRoleAssignmentId
        ? { practitionerRoleAssignmentId: refs.practitionerRoleAssignmentId }
        : {}),
      ...(refs.healthcareServiceId
        ? { healthcareServiceId: refs.healthcareServiceId }
        : {}),
      ...(refs.careSpaceId ? { careSpaceId: refs.careSpaceId } : {}),
      ...(refs.practiceSiteId ? { practiceSiteId: refs.practiceSiteId } : {}),
      ...(space?.locationPath ? { careSpacePath: space.locationPath } : {}),
      ...(space ? { careSpaceSiteId: space.practiceSiteId } : {}),
    };
  }

  /**
   * ¿El objetivo está dentro del alcance del actor para este átomo?
   *
   * @param actor - Alcance del actor.
   * @param atom - Átomo que define el alcance.
   * @param target - Objetivo.
   * @returns `true` si lo cubre.
   */
  inScope(actor: TeamActor, atom: string, target: GrantTargetFacts): boolean {
    if (actor.full) return true;
    return (actor.ctx.targets.get(atom) ?? []).some((t) =>
      targetWithin(target, t),
    );
  }

  /** Reglas de la organización que recortan el techo (`CEILING` y `DENY_PERMISSION`). */
  private async orgRules(
    em: EntityManager,
    tenantId: string,
    now: Date,
  ): Promise<TeamAdminOrgRule[]> {
    const rows = await this.rules.findActiveForTenant(em, tenantId, now);
    const out: TeamAdminOrgRule[] = [];
    for (const r of rows) {
      const kind =
        r.ruleKindConceptId === DELEG.GOV_RULE_CEILING
          ? 'CEILING'
          : r.ruleKindConceptId === DELEG.GOV_RULE_DENY_PERMISSION
            ? 'DENY_PERMISSION'
            : undefined;
      if (!kind) continue;
      out.push({
        kind,
        roleTemplateCode: r.roleTemplateCode ?? null,
        permissionPattern: r.permissionPattern,
      });
    }
    return out;
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

  /** Persona con su partición de alcance; `undefined` si no es administrable. */
  private member(
    actor: TeamActor,
    atom: string,
    record: EngagementRecord,
    allGrants: readonly LiveGrantView[],
    templates: ReadonlyMap<string, string>,
    allowUnscoped: boolean,
  ): ManagedMember | undefined {
    const grants = allGrants.filter(
      (g) => g.engagementId === record.assignment.id,
    );
    const templateCode = record.assignment.roleTemplateId
      ? templates.get(record.assignment.roleTemplateId)
      : undefined;
    const base = { record, ...(templateCode ? { templateCode } : {}), grants };
    if (actor.full) return { ...base, inScope: grants, outOfScopeCount: 0 };
    const part = partitionByScope(
      grants.map((g) => g.target),
      actor.ctx.targets.get(atom) ?? [],
    );
    if (!part.administrable && !(allowUnscoped && grants.length === 0)) {
      return undefined;
    }
    const inside = new Set<GrantTargetFacts>(part.inScope);
    return {
      ...base,
      inScope: grants.filter((g) => inside.has(g.target)),
      outOfScopeCount: part.outOfScopeCount,
    };
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Vínculo de apoyo no encontrado',
      undefined,
      Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
    );
  }
}
