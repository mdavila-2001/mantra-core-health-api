import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../common';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import { SupportActivityRepository } from '../repositories';
import type { AtomHoldingGrant } from '../domain';
import type {
  CreateSupportGrantDto,
  OffboardEngagementDto,
  OffboardResultDto,
  OperationResultDto,
  ReactivateEngagementDto,
  GrantChangePendingDto,
  RecertifyEngagementDto,
  ResourceCreatedDto,
  SuspendEngagementDto,
  SuspensionResultDto,
  HandoverPreviewDto,
  UpdateSupportGrantDto,
} from '../dto';
import { DelegationScopeService } from './delegation-scope.service';
import { EngagementHandoverService } from './engagement-handover.service';
import { EngagementSuspensionService } from './engagement-suspension.service';
import { governanceError } from './governance-errors';
import { GovernanceStepUpGate } from './governance-step-up.gate';
import { GrantProposalValidator } from './grant-proposal.validator';
import type { LifecycleGuard } from './lifecycle-guard';
import { LifecycleService } from './lifecycle.service';
import { SupportEngagementsService } from './support-engagements.service';
import {
  TeamAdminPolicy,
  type ManagedMember,
  type TeamActor,
} from './team-admin.policy';

/** Una concesión de una persona, tal como la ve quien administra (sin condiciones ni nombres). */
export interface TeamGrantView {
  readonly id: string;
  readonly targetKind: string;
  readonly practitionerRoleAssignmentId?: string;
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly practiceSiteId?: string;
  readonly atoms: readonly string[];
  readonly validTo?: Date;
}

/** Una persona del equipo administrable. */
export interface TeamMemberView {
  readonly engagementId: string;
  readonly userId: string;
  readonly personName?: string;
  readonly roleTemplateCode?: string;
  readonly status: string;
  /** Solo las concesiones dentro del alcance. */
  readonly grants: readonly TeamGrantView[];
  /** «Otras funciones de esta persona: N», sin detalle. */
  readonly otherFunctions: number;
}

/** Lista de personas administrables. */
export interface TeamMembersView {
  readonly items: TeamMemberView[];
  readonly count: number;
}

/** Lo que el actor puede hacer por `/org/team`. */
export interface TeamCapabilitiesView {
  readonly mode: 'FULL' | 'DELEGATED';
  readonly atoms: readonly string[];
  /** Cada alcance de otorgar con su techo (solo delegados). */
  readonly assignScopes: ReadonlyArray<{
    readonly target: Record<string, unknown>;
    readonly ceiling: Record<string, unknown>;
  }>;
}

const ASSIGN = 'team.grants.assign';
const REVOKE = 'team.grants.revoke';

/**
 * Administración delegada por `/org/team/*` (CONTRATO-GOBIERNO §6.4). La
 * autorización real es de `TeamAdminPolicy` (átomo, alcance y techo); el rol de
 * borde solo deja pasar. `SECURITY_ADMIN` usa las mismas rutas con alcance
 * total. Cada operación delega en el servicio que ya la hace
 * (`SupportEngagementsService`, suspensión, traspaso) tras comprobar la política.
 */
@Injectable()
export class TeamAdminService {
  /**
   * @param em - Contexto de persistencia.
   * @param policy - Alcance, techo y población administrable.
   * @param engagements - Permisos y recertificación.
   * @param validator - Condiciones, barandillas y segregación de funciones.
   * @param suspension - Suspensión y reactivación.
   * @param handover - Baja con traspaso.
   * @param _lifecycle - Ciclo de vida (casos); las rutas de casos viven en `TeamAdminCasesService`.
   * @param stepUp - Paso extra.
   * @param names - Nombres de las personas.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly policy: TeamAdminPolicy,
    private readonly engagements: SupportEngagementsService,
    private readonly validator: GrantProposalValidator,
    private readonly suspension: EngagementSuspensionService,
    private readonly handover: EngagementHandoverService,
    _lifecycle: LifecycleService,
    private readonly stepUp: GovernanceStepUpGate,
    private readonly names: SupportActivityRepository,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TeamAdminService.name);
  }

  /**
   * Mi alcance, mi techo y qué puedo hacer.
   *
   * @param actor - Quien consulta.
   * @returns Sus capacidades.
   */
  async capabilities(actor: AuthenticatedUser): Promise<TeamCapabilitiesView> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const me = await this.policy.actorOf(
      tx,
      actor,
      tenantId,
      'team.members.view',
      new Date(),
    );
    if (me.full) return { mode: 'FULL', atoms: [], assignScopes: [] };
    return {
      mode: 'DELEGATED',
      atoms: [...me.ctx.atoms].sort(),
      assignScopes: me.ctx.assignGrants.map((g) => ({
        target: { ...g.target },
        ceiling: { ...g.ceiling },
      })),
    };
  }

  /**
   * Solo la población administrable y, de cada persona, solo sus concesiones dentro del alcance.
   *
   * @param actor - Quien consulta.
   * @returns Las personas.
   */
  async listMembers(actor: AuthenticatedUser): Promise<TeamMembersView> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const me = await this.policy.actorOf(
      tx,
      actor,
      tenantId,
      'team.members.view',
      now,
    );
    const members = await this.policy.population(
      tx,
      me,
      tenantId,
      'team.members.view',
      now,
    );
    const items = await this.views(tx, members);
    return { items, count: items.length };
  }

  /**
   * Una persona; fuera de su alcance responde como inexistente (404 uniforme).
   *
   * @param engagementId - Vínculo.
   * @param actor - Quien consulta.
   * @returns La persona con su parte visible.
   */
  async getMember(
    engagementId: string,
    actor: AuthenticatedUser,
  ): Promise<TeamMemberView> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const me = await this.policy.actorOf(
      tx,
      actor,
      tenantId,
      'team.members.view',
      now,
    );
    const member = await this.policy.memberOf(
      tx,
      me,
      tenantId,
      engagementId,
      'team.members.view',
      now,
    );
    return (await this.views(tx, [member]))[0];
  }

  /**
   * Otorga un permiso dentro de su alcance y techo (paso extra incluido) y con
   * la validación común (condiciones, barandillas, funciones).
   *
   * @param engagementId - Vínculo de la persona.
   * @param dto - Mismo cuerpo que `/org/support-engagements/:id/grants`.
   * @param actor - Quien otorga.
   * @returns El permiso creado.
   */
  async addGrant(
    engagementId: string,
    dto: CreateSupportGrantDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto | GrantChangePendingDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const me = await this.policy.actorOf(tx, actor, tenantId, ASSIGN, now);
    await this.stepUp.assertFresh(tx, actor);
    const member = await this.policy.memberOf(
      tx,
      me,
      tenantId,
      engagementId,
      ASSIGN,
      now,
      true,
    );
    await this.policy.assertNotPeer(tx, me, member, tenantId, now);
    const target = await this.policy.targetOf(tx, dto);
    const validTo = dto.validTo ? new Date(dto.validTo) : undefined;
    const templateCode = member.templateCode ?? '';
    await this.policy.assertGrantAllowed(tx, me, {
      tenantId,
      target,
      atoms: dto.actions,
      templateCode,
      validTo,
      now,
    });
    const issues = await this.validator.validate(tx, {
      tenantId,
      templateCode,
      grants: [
        {
          ...target,
          actions: dto.actions,
          effect: 'ALLOW',
          validTo,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        },
      ],
      actor: { delegatedAdmin: !me.full },
      subjectEngagementId: engagementId,
      kept: keptGrants(member),
      now,
    });
    if (issues.length > 0) {
      throw governanceError(
        issues[0].code as Reason,
        'El permiso no es válido: revise los problemas indicados.',
        {
          issues: issues.map((i) => ({ ...i })),
        },
      );
    }
    return this.engagements.addGrant(engagementId, dto, actor);
  }

  /**
   * Quita un permiso (basta con que se cruce con su alcance) o lo edita (dentro
   * de su alcance y techo). Con solo `team.grants.revoke` solo se puede quitar.
   *
   * @param engagementId - Vínculo de la persona.
   * @param dto - Mismo cuerpo que `PATCH /org/support-engagements/:id/grants`.
   * @param actor - Quien lo cambia.
   * @returns `{ ok: true }`.
   */
  async updateGrant(
    engagementId: string,
    dto: UpdateSupportGrantDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto | GrantChangePendingDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const atom = dto.revoke ? REVOKE : ASSIGN;
    const me = await this.policy.actorOf(tx, actor, tenantId, atom, now);
    // Todo cambio que no sea quitar puede ampliar (acciones, vigencia, alcance,
    // condiciones): exige el paso extra, igual que otorgar.
    if (!dto.revoke) await this.stepUp.assertFresh(tx, actor);
    const member = await this.policy.memberOf(
      tx,
      me,
      tenantId,
      engagementId,
      atom,
      now,
    );
    await this.policy.assertNotPeer(tx, me, member, tenantId, now);
    const grant = this.policy.assertRevocable(me, member, dto.grantId, atom);
    if (!dto.revoke && !me.full) {
      // El alcance y el techo se miden con lo que la concesión CUBRIRÁ después
      // del cambio (p. ej. `FIXED` → `DYNAMIC` suelta la foto).
      const after = this.policy.resultingTarget(grant, dto.expansionMode);
      if (!this.policy.inScope(me, ASSIGN, after)) {
        throw governanceError(
          Reason.ADMIN_SCOPE_EXCEEDED,
          'Ese permiso está fuera de su alcance.',
        );
      }
      this.policy.assertConditionsNotLoosened(me, grant, dto);
      await this.policy.assertGrantAllowed(tx, me, {
        tenantId,
        target: after,
        atoms: dto.actions ?? grant.atoms,
        templateCode: member.templateCode ?? '',
        validTo: dto.validTo ? new Date(dto.validTo) : grant.validTo,
        now,
      });
    }
    return this.engagements.updateGrant(engagementId, dto, actor);
  }

  /**
   * Recertifica a la persona (toda la persona debe estar en su alcance).
   *
   * @param engagementId - Vínculo.
   * @param dto - Periodicidad.
   * @param actor - Quien confirma.
   * @returns `{ ok: true }`.
   */
  async recertify(
    engagementId: string,
    dto: RecertifyEngagementDto,
    actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    await this.wholePerson(engagementId, actor, 'team.engagement.recertify');
    return this.engagements.recertify(engagementId, dto, actor);
  }

  /**
   * Suspende a la persona al instante (toda la persona debe estar en su alcance).
   *
   * @param engagementId - Vínculo.
   * @param dto - Motivo y nota.
   * @param actor - Quien suspende.
   * @returns `{ ok: true }`.
   */
  async suspend(
    engagementId: string,
    dto: SuspendEngagementDto,
    actor: AuthenticatedUser,
  ): Promise<SuspensionResultDto> {
    const guard = await this.wholePerson(
      engagementId,
      actor,
      'team.engagement.suspend',
    );
    return this.suspension.suspend(engagementId, dto, actor, undefined, guard);
  }

  /**
   * Pide reactivar (cuatro ojos).
   *
   * @param engagementId - Vínculo.
   * @param dto - Motivo.
   * @param actor - Quien lo pide.
   * @returns La solicitud pendiente.
   */
  async reactivate(
    engagementId: string,
    dto: ReactivateEngagementDto,
    actor: AuthenticatedUser,
  ): Promise<SuspensionResultDto> {
    const guard = await this.wholePerson(
      engagementId,
      actor,
      'team.engagement.reactivate',
    );
    return this.suspension.reactivate(
      engagementId,
      dto,
      actor,
      undefined,
      guard,
    );
  }

  /**
   * Da de baja con traspaso (necesita `team.engagement.end` y `team.handover.execute`).
   *
   * @param engagementId - Vínculo.
   * @param dto - Motivo y traspaso.
   * @param actor - Quien da de baja.
   * @returns La baja firme y el estado del traspaso.
   */
  async offboard(
    engagementId: string,
    dto: OffboardEngagementDto,
    actor: AuthenticatedUser,
  ): Promise<OffboardResultDto> {
    const tenantId = this.scope.resolveTenant();
    await this.policy.actorOf(
      this.em.fork({ keepTransactionContext: true }),
      actor,
      tenantId,
      'team.handover.execute',
      new Date(),
    );
    const guard = await this.wholePerson(
      engagementId,
      actor,
      'team.engagement.end',
    );
    return this.handover.offboard(engagementId, dto, actor, guard);
  }

  /**
   * Lo que la persona tiene en las manos (toda la persona debe estar en su alcance).
   *
   * @param engagementId - Vínculo.
   * @param actor - Quien consulta.
   * @returns La vista previa.
   */
  async handoverPreview(
    engagementId: string,
    actor: AuthenticatedUser,
  ): Promise<HandoverPreviewDto> {
    const guard = await this.wholePerson(
      engagementId,
      actor,
      'team.handover.execute',
    );
    return this.handover.preview(engagementId, guard);
  }

  /**
   * Comprueba átomo, alcance sobre TODA la persona y GP-6 antes de actuar, y
   * devuelve la guarda que el servicio repite dentro de su transacción.
   */
  private async wholePerson(
    engagementId: string,
    actor: AuthenticatedUser,
    atom: string,
  ): Promise<LifecycleGuard> {
    const tenantId = this.scope.resolveTenant();
    const check = async (
      em: EntityManager,
      me: TeamActor,
      now: Date,
    ): Promise<void> => {
      const member = await this.policy.memberOf(
        em,
        me,
        tenantId,
        engagementId,
        atom,
        now,
      );
      await this.policy.assertNotPeer(em, me, member, tenantId, now);
      this.policy.assertWholePerson(me, member);
    };
    const tx = this.em.fork({ keepTransactionContext: true });
    const now = new Date();
    const me = await this.policy.actorOf(tx, actor, tenantId, atom, now);
    await check(tx, me, now);
    return (ctx) => check(ctx.em, me, new Date());
  }

  private async views(
    em: EntityManager,
    members: readonly ManagedMember[],
  ): Promise<TeamMemberView[]> {
    const names = members.length
      ? await this.names.userNames(em, [
          ...new Set(members.map((m) => m.record.userId)),
        ])
      : new Map<string, string>();
    return members.map((m) => ({
      engagementId: m.record.assignment.id,
      userId: m.record.userId,
      ...(names.get(m.record.userId)
        ? { personName: names.get(m.record.userId) }
        : {}),
      ...(m.templateCode ? { roleTemplateCode: m.templateCode } : {}),
      status: m.record.assignment.statusConceptId,
      grants: m.inScope.map((g) => ({
        id: g.grantId,
        targetKind: g.target.targetKind,
        practitionerRoleAssignmentId: g.target.practitionerRoleAssignmentId,
        healthcareServiceId: g.target.healthcareServiceId,
        careSpaceId: g.target.careSpaceId,
        practiceSiteId: g.target.practiceSiteId,
        atoms: g.atoms,
        validTo: g.validTo,
      })),
      otherFunctions: m.outOfScopeCount,
    }));
  }
}

/** Lo que la persona conserva, para los conflictos de funciones. */
function keptGrants(member: ManagedMember): AtomHoldingGrant[] {
  return member.grants.map((g) => ({
    ...g.target,
    grantId: g.grantId,
    actions: g.atoms,
    effect: g.effect,
    active: true,
    validFrom: g.validFrom,
    validTo: g.validTo,
  }));
}
