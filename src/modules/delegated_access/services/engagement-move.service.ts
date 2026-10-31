import { Injectable, Optional } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AUTHZ } from '../../authz/authz.concepts';
import { OutboxService } from '../../messaging/services/outbox.service';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  atomsOfGrant,
  canonicalJson,
  checklistFor,
  isSupportAtom,
  MOVER_REVIEW_POLICY,
  ownerEligibility,
  permissionAtomId,
  planMove,
  supportPermissionId,
  type MoveCurrentGrant,
  type MoveGrantInput,
  type ReviewerGrantFacts,
  type MovePlan,
  type SupportActionCode,
  type SupportTargetKind,
} from '../domain';
import type {
  OrganizationUserAssignments,
  SupportScopeGrants,
} from '../entities';
import type { MoveEngagementDto, MoveResultDto } from '../dto';
import {
  LifecycleRepository,
  RoleTemplatesRepository,
  SupportAccessRepository,
  SupportGrantsRepository,
  type EngagementRecord,
} from '../repositories';
import { verifySimulationToken } from './access-explain.support';
import { assignmentRoleOfTemplate, STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { EffectiveSupportAccessService } from './effective-support-access.service';
import { governanceError } from './governance-errors';
import { GovernanceStepUpGate } from './governance-step-up.gate';
import {
  GrantProposalValidator,
  type ProposalIssue,
} from './grant-proposal.validator';
import { LifecycleFourEyes } from './lifecycle-four-eyes';
import { LifecycleReviewOpener } from './lifecycle-review-opener';
import { ReviewerResolverService } from './reviewer-resolver.service';
import {
  EXPANSION_CONCEPT,
  TARGET_KIND_BY_CONCEPT,
  TARGET_KIND_CONCEPT,
  readSnapshot,
  supportActionInputsOfPermissionIds,
} from './support-grant-facts';
import { SupportAdminDirectory } from './support-admin-directory';
import { SupportTargetsService } from './support-targets.service';

/** Una concesión del cuerpo firmado: JSON puro (fechas en ISO, acciones ordenadas). */
export interface MovePayloadGrant {
  readonly targetKind: SupportTargetKind;
  readonly practitionerRoleAssignmentId?: string;
  readonly healthcareServiceId?: string;
  readonly careSpaceId?: string;
  readonly practiceSiteId?: string;
  readonly actions: readonly string[];
  readonly effect: 'ALLOW' | 'DENY';
  readonly condition?: Record<string, unknown>;
  readonly expansionMode: 'DYNAMIC' | 'FIXED';
  readonly validFrom?: string;
  readonly validTo?: string;
}

/** Cuerpo firmado de un cambio de rol (lo que se aprueba y luego se ejecuta). */
export interface MovePayload {
  readonly engagementId: string;
  readonly effectiveAt: string;
  readonly newTemplateCode?: string;
  readonly supervisorUserId?: string;
  readonly reason: string;
  readonly grants: readonly MovePayloadGrant[];
  /** `row_version` del vínculo al pedir: si cambió, la aprobación ya no vale. */
  readonly assignmentRowVersion: number;
}

interface Prepared {
  readonly record: EngagementRecord;
  readonly template: { id: string; code: string };
  readonly templateChanged: boolean;
  readonly current: ReadonlyArray<{
    row: SupportScopeGrants;
    facts: MoveCurrentGrant;
  }>;
  readonly plan: MovePlan;
  readonly effectiveAt: Date;
}

const permissionIdOf = (code: string): string =>
  isSupportAtom(code)
    ? permissionAtomId(code)
    : supportPermissionId(code as SupportActionCode);

/**
 * Cambio de rol o alcance (mover, CONTRATO-GOBIERNO §6.1): el conjunto propuesto
 * es COMPLETO, lo anterior vence en `effectiveAt` (mínimo privilegio, sin gracia),
 * se abre una campaña `MOVER` para el dueño y, si el puntaje sube más de 10
 * puntos o aparece un átomo de sensibilidad ALTA nuevo, pasa por cuatro ojos.
 */
@Injectable()
export class EngagementMoveService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Lecturas de vínculos y permisos.
   * @param grants - Permisos de apoyo.
   * @param templates - Plantillas de rol.
   * @param targets - Validación de objetivos contra la organización.
   * @param validator - Condiciones, barandillas y segregación de funciones.
   * @param lifecycle - Casos de ciclo de vida.
   * @param fourEyes - Solicitudes de cuatro ojos.
   * @param review - Campañas que abre el ciclo de vida.
   * @param effective - Acceso efectivo derivado.
   * @param directory - Quién es quién (dueño de la cuenta).
   * @param stepUp - Paso extra del administrador.
   * @param outbox - Eventos de dominio.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   * @param reviewers - Revisores de la campaña `MOVER` (el doctor de la concesión o el dueño).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly grants: SupportGrantsRepository,
    private readonly templates: RoleTemplatesRepository,
    private readonly targets: SupportTargetsService,
    private readonly validator: GrantProposalValidator,
    private readonly lifecycle: LifecycleRepository,
    private readonly fourEyes: LifecycleFourEyes,
    private readonly review: LifecycleReviewOpener,
    private readonly effective: EffectiveSupportAccessService,
    private readonly directory: SupportAdminDirectory,
    private readonly stepUp: GovernanceStepUpGate,
    private readonly outbox: OutboxService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
    @Optional() private readonly reviewers?: ReviewerResolverService,
  ) {
    this.logger.setContext(EngagementMoveService.name);
  }

  /**
   * Cambia el rol o alcance de una persona: valida como `simulate`; si sube
   * privilegios pide cuatro ojos (202) y si no, ejecuta de inmediato.
   *
   * @param engagementId - Vínculo.
   * @param dto - Conjunto completo nuevo.
   * @param actor - Administrador de seguridad (con paso extra).
   * @param now - Reloj.
   * @returns El resultado o la solicitud pendiente.
   */
  async move(
    engagementId: string,
    dto: MoveEngagementDto,
    actor: AuthenticatedUser,
    now: Date = new Date(),
  ): Promise<MoveResultDto> {
    const tenantId = this.scope.resolveTenant();
    this.logger.info(
      {
        operation: 'delegated_access.lifecycle.move',
        engagementId,
        tenantId,
        actorId: actor.id,
      },
      'Moving support engagement',
    );
    return this.em.transactional(async (tx) => {
      await this.stepUp.assertFresh(tx, actor);
      this.assertSimulated(engagementId, dto, now);
      const payload = this.payloadOf(engagementId, dto, now);
      const prepared = await this.prepare(tx, tenantId, payload, now, false);
      const summary = this.summary(prepared.plan);
      if (prepared.plan.fourEyes.requiresFourEyes) {
        const created = await this.fourEyes.request(
          tx,
          {
            tenantId,
            kind: 'ENGAGEMENT_MOVE',
            actor,
            subjectUserId: prepared.record.userId,
            engagementId,
            payload: {
              ...payload,
              assignmentRowVersion: prepared.record.assignment.rowVersion,
            },
            reasonText: dto.reason,
          },
          now,
        );
        return {
          status: 'PENDING_APPROVAL',
          approvalId: created.approvalId,
          expiresAt: created.expiresAt,
          ...summary,
        };
      }
      const done = await this.apply(
        tx,
        tenantId,
        prepared,
        payload,
        actor.id,
        undefined,
        now,
      );
      return { status: 'EXECUTED', ...summary, ...done };
    });
  }

  /**
   * Ejecuta el cambio aprobado con el cuerpo firmado, dentro de la transacción de
   * la aprobación, re-validando todo.
   *
   * @param tx - Transacción de la aprobación.
   * @param tenantId - Organización.
   * @param payload - Cuerpo firmado.
   * @param requesterUserId - Quien pidió.
   * @param approverUserId - Quien aprobó.
   * @param now - Reloj.
   * @returns El resultado de la ejecución.
   * @throws DomainException 409 `FOUR_EYES_PAYLOAD_INVALID` si ya no es válido.
   */
  async executeApproved(
    tx: EntityManager,
    tenantId: string,
    payload: MovePayload,
    requesterUserId: string,
    approverUserId: string,
    now: Date = new Date(),
  ): Promise<MoveResultDto> {
    const prepared = await this.prepare(tx, tenantId, payload, now, true);
    if (
      prepared.record.assignment.rowVersion !== payload.assignmentRowVersion
    ) {
      throw this.invalid('El vínculo cambió desde que se pidió la aprobación.');
    }
    const done = await this.apply(
      tx,
      tenantId,
      prepared,
      payload,
      requesterUserId,
      approverUserId,
      now,
    );
    return { status: 'EXECUTED', ...this.summary(prepared.plan), ...done };
  }

  /**
   * Si llega un `simulationToken`, lo que se mueve tiene que ser lo que se
   * simuló (`POST /org/access/simulate` con `mode: 'REPLACE'`): mismo vínculo,
   * mismo conjunto completo y plantilla, a lo más 10 minutos antes. Sin token el
   * cliente de API sigue moviendo como siempre.
   *
   * @throws DomainException 409 `SIMULATION_STALE`.
   */
  private assertSimulated(
    engagementId: string,
    dto: MoveEngagementDto,
    now: Date,
  ): void {
    if (!dto.simulationToken) return;
    const verdict = verifySimulationToken(
      dto.simulationToken,
      engagementId,
      {
        mode: 'REPLACE',
        templateCode: dto.newTemplateCode ?? null,
        grants: dto.grants.map((g) => ({
          effect: g.effect ?? 'ALLOW',
          actions: [...g.actions],
          ...(g.condition ? { condition: g.condition } : {}),
          targetKind: g.targetKind,
          ...(g.practitionerRoleAssignmentId
            ? { practitionerRoleAssignmentId: g.practitionerRoleAssignmentId }
            : {}),
          ...(g.healthcareServiceId
            ? { healthcareServiceId: g.healthcareServiceId }
            : {}),
          ...(g.careSpaceId ? { careSpaceId: g.careSpaceId } : {}),
          ...(g.practiceSiteId ? { practiceSiteId: g.practiceSiteId } : {}),
          ...(g.validTo ? { validTo: g.validTo } : {}),
        })),
        removeGrantIds: [],
      },
      now,
    );
    if (verdict !== 'OK') {
      throw governanceError(
        Reason.SIMULATION_STALE,
        'Lo que va a mover no es lo que simuló (o la simulación venció). Simule de nuevo.',
      );
    }
  }

  /** Cuerpo canónico a partir del DTO: acciones únicas y ordenadas, fechas en ISO. */
  private payloadOf(
    engagementId: string,
    dto: MoveEngagementDto,
    now: Date,
  ): MovePayload {
    const at = dto.effectiveAt ? new Date(dto.effectiveAt) : now;
    return {
      engagementId,
      effectiveAt: (at.getTime() < now.getTime() ? now : at).toISOString(),
      ...(dto.newTemplateCode ? { newTemplateCode: dto.newTemplateCode } : {}),
      ...(dto.supervisorUserId
        ? { supervisorUserId: dto.supervisorUserId }
        : {}),
      reason: dto.reason,
      grants: dto.grants.map((g) => ({
        targetKind: g.targetKind,
        ...(g.practitionerRoleAssignmentId
          ? { practitionerRoleAssignmentId: g.practitionerRoleAssignmentId }
          : {}),
        ...(g.healthcareServiceId
          ? { healthcareServiceId: g.healthcareServiceId }
          : {}),
        ...(g.careSpaceId ? { careSpaceId: g.careSpaceId } : {}),
        ...(g.practiceSiteId ? { practiceSiteId: g.practiceSiteId } : {}),
        actions: [...new Set(g.actions)].sort(),
        effect: g.effect ?? 'ALLOW',
        ...(g.condition ? { condition: g.condition } : {}),
        expansionMode: g.expansionMode ?? 'DYNAMIC',
        ...(g.validFrom
          ? { validFrom: new Date(g.validFrom).toISOString() }
          : {}),
        ...(g.validTo ? { validTo: new Date(g.validTo).toISOString() } : {}),
      })),
      assignmentRowVersion: 0,
    };
  }

  /**
   * Revisor de cada ítem de la campaña `MOVER`: el doctor de la concesión si es
   * de un solo doctor con cuenta, si no el dueño de la cuenta y, sin dueño, un
   * administrador (`ReviewerResolver`; nunca la persona, quien otorgó ni quien aprobó).
   */
  private async routeReviewers(
    tx: EntityManager,
    tenantId: string,
    p: Prepared,
    a: OrganizationUserAssignments,
    items: Array<{
      reviewerUserId?: string;
      reviewerKind?: 'DOCTOR_OWNER' | 'SERVICE_HEAD' | 'SUPERVISOR' | 'ADMIN';
    }>,
    facts: ReviewerGrantFacts[],
  ): Promise<void> {
    if (!this.reviewers || items.length === 0) return;
    const profiles = await this.access.findRoleAssignments(
      tx,
      facts.flatMap((f) =>
        f.practitionerRoleAssignmentId ? [f.practitionerRoleAssignmentId] : [],
      ),
    );
    const withProfile = facts.map((f) => ({
      ...f,
      practitionerProfileId: f.practitionerRoleAssignmentId
        ? profiles.get(f.practitionerRoleAssignmentId)?.practitionerProfileId
        : undefined,
    }));
    const resolved = await this.reviewers.resolveForMove(
      tx,
      tenantId,
      {
        subjectUserId: p.record.userId,
        supervisorUserId: a.supervisorUserId ?? null,
      },
      withProfile,
    );
    resolved.forEach((r, i) => {
      items[i].reviewerKind = r.kind;
      if (r.kind !== 'ADMIN' && r.userIds[0])
        items[i].reviewerUserId = r.userIds[0];
    });
  }

  /** Valida todo y calcula el plan; nada se escribe. */
  private async prepare(
    tx: EntityManager,
    tenantId: string,
    payload: MovePayload,
    now: Date,
    approved: boolean,
  ): Promise<Prepared> {
    const [record] = await this.access.findEngagements(tx, {
      ids: [payload.engagementId],
      tenantId,
    });
    if (!record) {
      throw new ResourceNotFoundException(
        'Vínculo de apoyo no encontrado',
        undefined,
        Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
      );
    }
    const a = record.assignment;
    if (a.statusConceptId !== STATUS.ACTIVE) {
      throw governanceError(
        Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
        'El vínculo de apoyo no está activo.',
      );
    }
    const fail = (e: unknown): never => {
      if (!approved) throw e;
      throw this.invalid('Lo aprobado ya no es válido.');
    };
    const template = payload.newTemplateCode
      ? await this.templates.findEffectiveByCode(
          tx,
          tenantId,
          payload.newTemplateCode,
        )
      : a.roleTemplateId
        ? await this.templates.findById(tx, a.roleTemplateId)
        : null;
    if (!template) {
      throw governanceError(
        Reason.SUPPORT_TEMPLATE_NOT_FOUND,
        'Plantilla de rol no encontrada.',
      );
    }
    if (payload.supervisorUserId) {
      const candidate = await this.directory.ownerCandidate(
        tx,
        payload.supervisorUserId,
        tenantId,
        now,
      );
      const verdict = ownerEligibility({
        candidate,
        subjectUserId: record.userId,
      });
      if (!verdict.eligible) {
        fail(
          governanceError(
            verdict.reason === 'GUARDRAIL_SELF_SUPERVISION'
              ? Reason.GUARDRAIL_SELF_SUPERVISION
              : Reason.OWNER_NOT_ELIGIBLE,
            'El dueño propuesto no puede serlo de esta cuenta.',
          ),
        );
      }
    }
    for (const g of payload.grants) {
      try {
        await this.targets.assertTarget(tx, tenantId, g.targetKind, g);
      } catch (e) {
        fail(e);
      }
    }
    const withActions = await this.access.findGrantsWithActions(tx, [a.id]);
    const current = withActions
      .filter(
        ({ grant }) =>
          grant.statusConceptId === DELEG.SUPPORT_GRANT_ACTIVE &&
          (!grant.validTo || grant.validTo.getTime() > now.getTime()),
      )
      .map(({ grant, permissionIds }) => ({
        row: grant,
        facts: currentFacts(grant, permissionIds),
      }));
    const effectiveAt = new Date(payload.effectiveAt);
    const proposed: MoveGrantInput[] = payload.grants.map(proposedFacts);
    const issues = await this.validator.validate(tx, {
      tenantId,
      templateCode: template.code,
      grants: proposed.map((g, i) => ({
        ...g,
        actions: payload.grants[i].actions,
        condition: payload.grants[i].condition,
      })),
      subjectEngagementId: a.id,
      now,
    });
    if (issues.length > 0) fail(this.issuesError(issues));
    const plan = planMove({
      currentGrants: current.map((c) => c.facts),
      newGrants: proposed,
      effectiveAt,
      now,
    });
    return {
      record,
      template: { id: template.id, code: template.code },
      templateChanged:
        !!payload.newTemplateCode && template.id !== a.roleTemplateId,
      current,
      plan,
      effectiveAt,
    };
  }

  /** Ejecuta el plan en la transacción dada. */
  private async apply(
    tx: EntityManager,
    tenantId: string,
    p: Prepared,
    payload: MovePayload,
    requesterUserId: string,
    approverUserId: string | undefined,
    now: Date,
  ): Promise<Partial<MoveResultDto>> {
    const a = p.record.assignment;
    const immediate = p.effectiveAt.getTime() <= now.getTime();
    const revokedGrantIds: string[] = [];
    for (const r of p.plan.revoke) {
      const row = p.current.find((c) => c.row.id === r.grantId)!.row;
      if (immediate) row.statusConceptId = DELEG.SUPPORT_GRANT_REVOKED;
      row.validTo = r.validTo;
      touch(row, requesterUserId, now);
      revokedGrantIds.push(row.id);
    }
    const grantIds: string[] = [];
    const reviewItems: Array<{
      grantId: string;
      evidence: unknown;
      reviewerUserId?: string;
      reviewerKind?: 'DOCTOR_OWNER' | 'SERVICE_HEAD' | 'SUPERVISOR' | 'ADMIN';
    }> = [];
    const reviewFacts: ReviewerGrantFacts[] = [];
    for (const index of p.plan.createIndexes) {
      const g = payload.grants[index];
      const from = g.validFrom ? new Date(g.validFrom) : undefined;
      const validFrom =
        !immediate && (!from || from < p.effectiveAt) ? p.effectiveAt : from;
      const row = this.grants.create(tx, {
        tenantId,
        organizationUserAssignmentId: a.id,
        targetKindConceptId: TARGET_KIND_CONCEPT[g.targetKind],
        practitionerRoleAssignmentId: g.practitionerRoleAssignmentId,
        healthcareServiceId: g.healthcareServiceId,
        careSpaceId: g.careSpaceId,
        practiceSiteId: g.practiceSiteId,
        expansionModeConceptId: EXPANSION_CONCEPT[g.expansionMode],
        fixedSnapshot:
          g.expansionMode === 'FIXED'
            ? await this.targets.buildSnapshot(tx, tenantId, g.targetKind, g)
            : undefined,
        validFrom,
        validTo: g.validTo ? new Date(g.validTo) : undefined,
        statusConceptId: DELEG.SUPPORT_GRANT_ACTIVE,
        approvedByUserId: approverUserId ?? requesterUserId,
        actorUserId: requesterUserId,
        ...(g.effect === 'DENY' ? { effectConceptId: AUTHZ.EFFECT_DENY } : {}),
        condition: g.condition,
        conditionSchemaVersion:
          typeof g.condition?.schemaVersion === 'number'
            ? g.condition.schemaVersion
            : undefined,
        reasonText: payload.reason,
      });
      await tx.flush();
      this.grants.addActions(tx, row, g.actions.map(permissionIdOf));
      grantIds.push(row.id);
      if (g.effect !== 'DENY') {
        reviewFacts.push({
          grantId: row.id,
          targetKind: g.targetKind,
          expansionMode: g.expansionMode,
          practitionerRoleAssignmentId: g.practitionerRoleAssignmentId,
          healthcareServiceId: g.healthcareServiceId,
          careSpaceId: g.careSpaceId,
          practiceSiteId: g.practiceSiteId,
          grantedByUserId: requesterUserId,
          approvedByUserIds: [approverUserId],
        });
        reviewItems.push({
          grantId: row.id,
          evidence: {
            atoms: atomsOfGrant({ actions: g.actions }),
            scoreBefore: p.plan.scoreBefore,
            scoreAfter: p.plan.scoreAfter,
          },
        });
      }
    }
    if (p.templateChanged) {
      a.roleTemplateId = p.template.id;
      a.assignmentRoleConceptId = assignmentRoleOfTemplate(p.template.code);
    }
    if (payload.supervisorUserId) a.supervisorUserId = payload.supervisorUserId;
    touch(a, requesterUserId, now);
    await tx.flush();
    await this.effective.refreshTenant(tenantId, {
      userId: p.record.userId,
      actorUserId: requesterUserId,
      tx,
    });
    await this.routeReviewers(tx, tenantId, p, a, reviewItems, reviewFacts);
    const opened: { campaignId?: string; itemCount: number } =
      reviewItems.length === 0
        ? { itemCount: 0 }
        : await this.review.open(
            tx,
            {
              tenantId,
              kind: 'MOVER',
              name: 'Revisión del cambio de rol',
              dueDays: MOVER_REVIEW_POLICY.dueDays,
              engagementId: a.id,
              reviewerUserId: a.supervisorUserId ?? undefined,
              actorUserId: requesterUserId,
              items: reviewItems,
            },
            now,
          );
    const kase = this.lifecycle.createCase(tx, {
      tenantId,
      organizationUserAssignmentId: a.id,
      subjectUserId: p.record.userId,
      kindConceptId: DELEG.LIFECYCLE_MOVER,
      openedByUserId: requesterUserId,
      openedAt: now,
      reasonText: payload.reason,
      checklist: checklistFor('MOVER').map((i) => ({
        ...i,
        status:
          i.code === 'FOUR_EYES_APPROVED' && !approverUserId
            ? ('NOT_APPLICABLE' as const)
            : ('DONE' as const),
        completedAt: now,
      })),
      details: {
        scoreBefore: p.plan.scoreBefore,
        scoreAfter: p.plan.scoreAfter,
        approvedByUserId: approverUserId ?? null,
        campaignId: opened.campaignId ?? null,
      },
      actorUserId: requesterUserId,
    });
    this.lifecycle.complete(kase, now, requesterUserId);
    await tx.flush();
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: 'delegated_access.governance.engagement_moved',
      aggregateType: 'organization_user_assignment',
      aggregateId: a.id,
      payloadJson: {
        tenantId,
        engagementId: a.id,
        caseId: kase.id,
        grantIds,
        revokedGrantIds,
        campaignId: opened.campaignId ?? null,
      },
      actorUserId: requesterUserId,
    });
    return {
      grantIds,
      revokedGrantIds,
      campaignId: opened.campaignId,
      caseId: kase.id,
    };
  }

  private summary(
    plan: MovePlan,
  ): Pick<
    MoveResultDto,
    | 'scoreBefore'
    | 'scoreAfter'
    | 'delta'
    | 'fourEyesReasons'
    | 'revokedGrantIds'
  > {
    return {
      scoreBefore: plan.scoreBefore,
      scoreAfter: plan.scoreAfter,
      delta: plan.fourEyes.delta,
      fourEyesReasons: [...plan.fourEyes.reasons],
      revokedGrantIds: plan.revoke.map((r) => r.grantId),
    };
  }

  private issuesError(issues: readonly ProposalIssue[]): Error {
    const first = issues[0];
    return governanceError(
      first.code as Reason,
      'El cambio no es válido: revise los problemas indicados.',
      {
        issues: issues.map((i) => ({ ...i })),
      },
    );
  }

  private invalid(message: string): Error {
    return governanceError(Reason.FOUR_EYES_PAYLOAD_INVALID, message);
  }
}

/** Hechos de una concesión vigente para comparar con la propuesta. */
function currentFacts(
  grant: SupportScopeGrants,
  permissionIds: readonly string[],
): MoveCurrentGrant {
  return {
    grantId: grant.id,
    targetKind:
      TARGET_KIND_BY_CONCEPT[grant.targetKindConceptId] ?? 'PRACTITIONER',
    expansionMode:
      grant.expansionModeConceptId === DELEG.SUPPORT_EXPANSION_FIXED
        ? 'FIXED'
        : 'DYNAMIC',
    practitionerRoleAssignmentId: grant.practitionerRoleAssignmentId,
    healthcareServiceId: grant.healthcareServiceId,
    careSpaceId: grant.careSpaceId,
    practiceSiteId: grant.practiceSiteId,
    snapshot: readSnapshot(grant.fixedSnapshotJson),
    effect:
      !grant.effectConceptId || grant.effectConceptId === AUTHZ.EFFECT_ALLOW
        ? 'ALLOW'
        : 'DENY',
    actions: supportActionInputsOfPermissionIds(permissionIds),
    validFrom: grant.validFrom,
    validTo: grant.validTo,
    condition: grant.conditionJson ?? undefined,
  };
}

/** Hechos de una concesión propuesta, en la misma forma que las vigentes. */
function proposedFacts(g: MovePayloadGrant): MoveGrantInput {
  return {
    targetKind: g.targetKind,
    expansionMode: g.expansionMode,
    practitionerRoleAssignmentId: g.practitionerRoleAssignmentId,
    healthcareServiceId: g.healthcareServiceId,
    careSpaceId: g.careSpaceId,
    practiceSiteId: g.practiceSiteId,
    effect: g.effect,
    actions: g.actions,
    validFrom: g.validFrom ? new Date(g.validFrom) : undefined,
    validTo: g.validTo ? new Date(g.validTo) : undefined,
    condition: g.condition,
  };
}

/** Texto canónico de un cuerpo (útil para pruebas y trazas): claves ordenadas. */
export function canonicalMovePayload(payload: MovePayload): string {
  return canonicalJson(payload);
}

export type { OrganizationUserAssignments };
