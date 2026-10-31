import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services/outbox.service';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  checklistFor,
  leaverCaseStatus,
  ownerEligibility,
  planHandover,
  verifyRevokeBeforeReassign,
  type HandoverAssignment,
  type HandoverCandidate,
  type HandoverKind,
  type HandoverPlan,
  type HandoverRequest,
} from '../domain';
import type { HandoverItems, LifecycleCases } from '../entities';
import type {
  AssignHandoverDto,
  AssignHandoverResultDto,
  HandoverDto,
  HandoverPreviewDto,
  OffboardEngagementDto,
  OffboardResultDto,
} from '../dto';
import {
  HandoverWorkRepository,
  LifecycleRepository,
  SupportAccessRepository,
  type EngagementRecord,
} from '../repositories';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { governanceError } from './governance-errors';
import type { LifecycleGuard } from './lifecycle-guard';
import { SupportAccessPolicy } from './support-access.policy';
import { SupportAdminDirectory } from './support-admin-directory';
import { SupportEngagementsService } from './support-engagements.service';

const KIND_CONCEPT: Readonly<Record<HandoverKind, string>> = {
  CONVERSATION: DELEG.HANDOVER_CONVERSATION,
  WORKFLOW_TASK: DELEG.HANDOVER_WORKFLOW_TASK,
  SUPERVISED_ENGAGEMENT: DELEG.HANDOVER_SUPERVISED_ENGAGEMENT,
  PENDING_BOOKING: DELEG.HANDOVER_PENDING_BOOKING,
};
const KIND_BY_CONCEPT: Readonly<Record<string, HandoverKind>> =
  Object.fromEntries(
    Object.entries(KIND_CONCEPT).map(([k, v]) => [v, k as HandoverKind]),
  );
/** Etiqueta del ítem: nunca lleva datos del paciente. */
const SUMMARY: Readonly<Record<HandoverKind, string>> = {
  CONVERSATION: 'Conversación de la bandeja',
  WORKFLOW_TASK: 'Tarea abierta',
  SUPERVISED_ENGAGEMENT: 'Cuenta que supervisaba',
  PENDING_BOOKING: 'Cita pendiente de confirmar',
};

type HandoverStatusDto = {
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  pending: number;
};

/**
 * Baja con traspaso (leaver, CONTRATO-GOBIERNO §6.1). Orden fijo y en
 * transacciones separadas: primero se valida lo obligatorio (nada se escribe),
 * después se REVOCA y se confirma (`SupportEngagementsService.end`) y solo
 * entonces se reasigna. Un fallo del traspaso nunca deshace la baja: el caso
 * queda `OPEN` con lo pendiente. La cita pendiente NO cambia de dueño (D-21):
 * solo queda un responsable de seguimiento en el registro.
 */
@Injectable()
export class EngagementHandoverService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Lecturas de vínculos.
   * @param work - Lo que la persona tiene en las manos (bandeja, tareas, citas, cuentas).
   * @param lifecycle - Casos y traspasos.
   * @param engagements - Baja inmediata en cascada.
   * @param policy - Quién puede responder por cada doctor.
   * @param directory - Equipo vivo y candidatos a dueño.
   * @param outbox - Eventos de dominio.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly work: HandoverWorkRepository,
    private readonly lifecycle: LifecycleRepository,
    private readonly engagements: SupportEngagementsService,
    private readonly policy: SupportAccessPolicy,
    private readonly directory: SupportAdminDirectory,
    private readonly outbox: OutboxService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EngagementHandoverService.name);
  }

  /**
   * Lo que la persona tiene en las manos, por tipo y sin datos del paciente.
   *
   * @param engagementId - Vínculo.
   * @param guard - Autorización del llamador.
   * @param now - Reloj.
   * @returns Los trabajos y su recuento.
   */
  async preview(
    engagementId: string,
    guard?: LifecycleGuard,
    now: Date = new Date(),
  ): Promise<HandoverPreviewDto> {
    const tenantId = this.scope.resolveTenant();
    const tx = this.em.fork({ keepTransactionContext: true });
    const { record, candidates } = await this.load(
      tx,
      tenantId,
      engagementId,
      now,
    );
    if (guard) await guard({ tenantId, em: tx, record });
    const counts: Record<string, number> = {
      CONVERSATION: 0,
      WORKFLOW_TASK: 0,
      SUPERVISED_ENGAGEMENT: 0,
      PENDING_BOOKING: 0,
    };
    for (const c of candidates) counts[c.kind] += 1;
    return {
      engagementId,
      items: candidates.map((c) => ({ id: c.id, kind: c.kind })),
      counts,
    };
  }

  /**
   * Da de baja y traspasa. Valida, revoca y confirma, y después reasigna.
   *
   * @param engagementId - Vínculo.
   * @param dto - Motivo y traspaso (`null` = baja inmediata, traspaso pendiente).
   * @param actor - Quien da de baja.
   * @param guard - Autorización del llamador, antes de escribir.
   * @param now - Reloj.
   * @returns La baja firme y el estado del traspaso.
   */
  async offboard(
    engagementId: string,
    dto: OffboardEngagementDto,
    actor: AuthenticatedUser,
    guard?: LifecycleGuard,
    now: Date = new Date(),
  ): Promise<OffboardResultDto> {
    const tenantId = this.scope.resolveTenant();
    this.logger.info(
      {
        operation: 'delegated_access.lifecycle.offboard',
        engagementId,
        tenantId,
        actorId: actor.id,
      },
      'Offboarding support engagement',
    );
    const read = this.em.fork({ keepTransactionContext: true });
    const { record, candidates, replyers, userOfEngagement } = await this.load(
      read,
      tenantId,
      engagementId,
      now,
    );
    if (guard) await guard({ tenantId, em: read, record });
    if (record.assignment.statusConceptId === STATUS.REVOKED) {
      throw governanceError(
        Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
        'El vínculo ya está terminado.',
      );
    }
    const request = dto.handover === undefined ? {} : dto.handover;
    const plan = await this.plan(
      read,
      tenantId,
      candidates,
      request,
      replyers,
      userOfEngagement,
      now,
    );

    // 1) Revocar y confirmar: la baja es firme antes de tocar nada más.
    await this.engagements.end(engagementId, { reason: dto.reason }, actor);
    const [ended] = await this.access.findEngagements(
      this.em.fork({ keepTransactionContext: true }),
      {
        ids: [engagementId],
        tenantId,
      },
    );
    const revokedAt = ended?.assignment.validTo ?? new Date();

    // 2) El caso y el registro de traspaso; 3) la reasignación. Ninguno deshace la baja.
    let caseId: string | undefined;
    const pendingAll = plan.ok ? plan.assignments.length : 0;
    try {
      const created = await this.em.transactional((tx) =>
        this.openLeaverCase(tx, record, dto.reason, candidates, actor.id, now),
      );
      caseId = created.id;
      if (request === null) {
        return this.result(
          engagementId,
          revokedAt,
          caseId,
          'PENDING',
          pendingAll,
        );
      }
      const handover = await this.em.transactional(async (tx) => {
        const reassignedAt = new Date();
        const done = await this.reassign(
          tx,
          tenantId,
          caseId as string,
          plan,
          actor.id,
          reassignedAt,
        );
        const [fresh] = await this.access.findEngagements(tx, {
          ids: [engagementId],
          tenantId,
        });
        if (
          !verifyRevokeBeforeReassign(
            fresh?.assignment.validTo,
            done.reassignedAts,
          )
        ) {
          throw new Error('La reasignación quedó antes de la revocación');
        }
        return done;
      });
      return this.result(
        engagementId,
        revokedAt,
        caseId,
        handover.pending === 0 ? 'COMPLETED' : 'PENDING',
        handover.pending,
      );
    } catch (err) {
      this.logger.error(
        {
          operation: 'delegated_access.lifecycle.offboard.handover',
          engagementId,
          tenantId,
          err: err instanceof Error ? err.message : String(err),
        },
        'Handover failed after the engagement was ended; the case stays open',
      );
      return this.result(engagementId, revokedAt, caseId, 'FAILED', pendingAll);
    }
  }

  /**
   * Reasigna los traspasos pendientes de un caso de baja abierto.
   *
   * @param caseId - Caso de baja.
   * @param dto - Destinatarios.
   * @param actor - Quien reasigna.
   * @param guard - Autorización del llamador.
   * @param now - Reloj.
   * @returns El estado del traspaso.
   */
  async assign(
    caseId: string,
    dto: AssignHandoverDto,
    actor: AuthenticatedUser,
    guard?: LifecycleGuard,
    now: Date = new Date(),
  ): Promise<AssignHandoverResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const kase = await this.lifecycle.findCaseById(tx, tenantId, caseId);
      if (
        !kase ||
        kase.statusConceptId !== DELEG.LIFECYCLE_OPEN ||
        kase.kindConceptId !== DELEG.LIFECYCLE_LEAVER
      ) {
        throw new ResourceNotFoundException(
          'Caso no encontrado',
          undefined,
          Reason.LIFECYCLE_CASE_NOT_FOUND,
        );
      }
      if (guard) await guard({ tenantId, em: tx });
      const rows = (await this.lifecycle.findHandoverItems(tx, caseId)).filter(
        (r) => r.statusConceptId === DELEG.HANDOVER_PENDING,
      );
      const conversationIds = rows
        .filter((r) => r.itemKindConceptId === DELEG.HANDOVER_CONVERSATION)
        .map((r) => r.sourceId);
      const profiles = conversationIds.length
        ? await this.work.conversationProfiles(tx, conversationIds)
        : new Map<string, string>();
      const candidates: HandoverCandidate[] = rows.map((r) => ({
        id: r.sourceId,
        kind: kindOfRow(r),
        fromUserId: r.fromUserId,
        ...(profiles.get(r.sourceId)
          ? { practitionerProfileId: profiles.get(r.sourceId) }
          : {}),
      }));
      const replyers = await this.replyersOf(tx, tenantId, candidates);
      const plan = await this.plan(
        tx,
        tenantId,
        candidates,
        dto,
        replyers,
        new Map(
          (await this.access.findEngagements(tx, { tenantId })).map((r) => [
            r.assignment.id,
            r.userId,
          ]),
        ),
        now,
      );
      const done = await this.reassign(
        tx,
        tenantId,
        caseId,
        plan,
        actor.id,
        now,
      );
      return {
        caseId,
        handover: {
          status: done.pending === 0 ? 'COMPLETED' : 'PENDING',
          pending: done.pending,
        },
      };
    });
  }

  /** Vínculo, trabajos que tiene en las manos y quién puede responder por cada doctor. */
  private async load(
    tx: EntityManager,
    tenantId: string,
    engagementId: string,
    now: Date,
  ): Promise<{
    record: EngagementRecord;
    candidates: HandoverCandidate[];
    replyers: Record<string, string[]>;
    userOfEngagement: ReadonlyMap<string, string>;
  }> {
    const [record] = await this.access.findEngagements(tx, {
      ids: [engagementId],
      tenantId,
    });
    if (!record) {
      throw new ResourceNotFoundException(
        'Vínculo de apoyo no encontrado',
        undefined,
        Reason.SUPPORT_ENGAGEMENT_NOT_FOUND,
      );
    }
    const userId = record.userId;
    const [conversations, taskIds, bookings, tenantRecords] = await Promise.all(
      [
        this.work.findOpenConversations(tx, tenantId, userId),
        this.work.findOpenTaskIds(tx, tenantId, userId),
        this.work.findPendingBookings(tx, tenantId, userId, now),
        this.access.findEngagements(tx, { tenantId }),
      ],
    );
    const supervised = await this.work.findSupervised(
      tx,
      tenantRecords
        .map((r) => r.assignment.id)
        .filter((id) => id !== engagementId),
      userId,
    );
    const candidates: HandoverCandidate[] = [
      ...conversations.map((c) => ({
        id: c.id,
        kind: 'CONVERSATION' as const,
        fromUserId: userId,
        practitionerProfileId: c.practitionerProfileId,
      })),
      ...taskIds.map((id) => ({
        id,
        kind: 'WORKFLOW_TASK' as const,
        fromUserId: userId,
      })),
      ...supervised.map((s) => ({
        id: s.id,
        kind: 'SUPERVISED_ENGAGEMENT' as const,
        fromUserId: userId,
      })),
      ...bookings.map((b) => ({
        id: b.id,
        kind: 'PENDING_BOOKING' as const,
        fromUserId: userId,
      })),
    ];
    return {
      record,
      candidates,
      replyers: await this.replyersOf(tx, tenantId, candidates),
      userOfEngagement: new Map(
        tenantRecords.map((r) => [r.assignment.id, r.userId]),
      ),
    };
  }

  private async replyersOf(
    tx: EntityManager,
    tenantId: string,
    candidates: readonly HandoverCandidate[],
  ): Promise<Record<string, string[]>> {
    const out: Record<string, string[]> = {};
    for (const profile of new Set(
      candidates
        .map((c) => c.practitionerProfileId)
        .filter((p): p is string => !!p),
    )) {
      out[profile] = await this.policy.replyersOfDoctor(tenantId, profile, tx);
    }
    return out;
  }

  /** Plan del traspaso con TODO validado antes de escribir (destinatarios vivos y dueños elegibles). */
  private async plan(
    tx: EntityManager,
    tenantId: string,
    candidates: readonly HandoverCandidate[],
    request: HandoverRequest | HandoverDto | null,
    replyers: Record<string, string[]>,
    userOfEngagement: ReadonlyMap<string, string>,
    now: Date,
  ): Promise<HandoverPlan> {
    if (request === null) {
      return planHandover({ items: candidates, handover: null });
    }
    const targets = [
      request.defaultToUserId,
      request.supervisedTo,
      ...(request.items ?? []).map((i) => i.toUserId),
    ].filter((t): t is string => !!t);
    const live = await this.directory.liveMemberUserIds(
      tx,
      tenantId,
      [...new Set(targets)],
      now,
    );
    const plan = planHandover({
      items: candidates,
      handover: request,
      replyersByDoctor: replyers,
      eligibleTargetUserIds: [...live],
    });
    if (!plan.ok) {
      throw governanceError(
        plan.issues[0].code === 'HANDOVER_SUPERVISOR_REQUIRED'
          ? Reason.HANDOVER_SUPERVISOR_REQUIRED
          : Reason.HANDOVER_TARGET_INELIGIBLE,
        plan.issues[0].code === 'HANDOVER_SUPERVISOR_REQUIRED'
          ? 'Elija quién será el nuevo dueño de las cuentas que supervisaba.'
          : 'Quien recibe el trabajo debe ser del equipo vigente y no la persona que se va.',
        { issues: plan.issues.map((i) => ({ ...i })) },
      );
    }
    for (const a of plan.assignments) {
      if (a.kind !== 'SUPERVISED_ENGAGEMENT' || !a.toUserId) continue;
      const candidate = await this.directory.ownerCandidate(
        tx,
        a.toUserId,
        tenantId,
        now,
      );
      const verdict = ownerEligibility({
        candidate,
        subjectUserId: userOfEngagement.get(a.itemId) ?? '',
      });
      if (!verdict.eligible) {
        throw governanceError(
          Reason.HANDOVER_TARGET_INELIGIBLE,
          'El nuevo dueño debe ser administrador, doctor de la organización o administrador delegado.',
          {
            issues: [{ code: 'HANDOVER_TARGET_INELIGIBLE', itemId: a.itemId }],
          },
        );
      }
    }
    return plan;
  }

  /** Caso de baja abierto con su registro de traspaso, todo pendiente. */
  private async openLeaverCase(
    tx: EntityManager,
    record: EngagementRecord,
    reason: string,
    candidates: readonly HandoverCandidate[],
    actorUserId: string,
    now: Date,
  ): Promise<LifecycleCases> {
    const kase = this.lifecycle.createCase(tx, {
      tenantId: record.tenantId,
      organizationUserAssignmentId: record.assignment.id,
      subjectUserId: record.userId,
      kindConceptId: DELEG.LIFECYCLE_LEAVER,
      openedByUserId: actorUserId,
      openedAt: now,
      reasonText: reason,
      checklist: checklistFor('LEAVER').map((i) =>
        i.code === 'ACCESS_REVOKED'
          ? { ...i, status: 'DONE' as const, completedAt: now }
          : i,
      ),
      actorUserId,
    });
    await tx.flush();
    this.lifecycle.createHandoverItems(
      tx,
      candidates.map((c) => ({
        tenantId: record.tenantId,
        lifecycleCaseId: kase.id,
        itemKindConceptId: KIND_CONCEPT[c.kind],
        sourceId: c.id,
        fromUserId: c.fromUserId,
        summaryText: SUMMARY[c.kind],
        actorUserId,
      })),
    );
    await tx.flush();
    await this.outbox.publishDomainEvent(tx, {
      tenantId: record.tenantId,
      eventType: 'delegated_access.lifecycle.leaver_executed',
      aggregateType: 'lifecycle_case',
      aggregateId: kase.id,
      payloadJson: {
        tenantId: record.tenantId,
        caseId: kase.id,
        engagementId: record.assignment.id,
        pendingItems: candidates.length,
      },
      actorUserId,
    });
    return kase;
  }

  /** Aplica las asignaciones sobre las filas pendientes del caso y lo cierra si no queda nada. */
  private async reassign(
    tx: EntityManager,
    tenantId: string,
    caseId: string,
    plan: HandoverPlan,
    actorUserId: string,
    now: Date,
  ): Promise<{ pending: number; reassignedAts: Date[] }> {
    if (!plan.ok) return { pending: 0, reassignedAts: [] };
    const rows = (await this.lifecycle.findHandoverItems(tx, caseId)).filter(
      (r) => r.statusConceptId === DELEG.HANDOVER_PENDING,
    );
    const reassignedAts: Date[] = [];
    for (const a of plan.assignments) {
      if (a.status === 'PENDING') continue;
      const row = rows.find((r) => r.sourceId === a.itemId);
      await this.touch(tx, tenantId, a, actorUserId, now);
      if (row) this.mark(row, a, actorUserId, now);
      reassignedAts.push(now);
    }
    await tx.flush();
    const pending = await this.lifecycle.countPendingHandover(tx, caseId);
    const kase = await this.lifecycle.findCaseById(tx, tenantId, caseId);
    if (
      kase &&
      leaverCaseStatus(
        plan.assignments.filter((a) => a.status === 'PENDING'),
      ) === 'COMPLETED' &&
      pending === 0
    ) {
      kase.checklistJson = checklistFor('LEAVER').map((i) => ({
        ...i,
        status: 'DONE' as const,
        completedAt: now,
      }));
      this.lifecycle.complete(kase, now, actorUserId);
      await this.notifyFollowUps(
        tx,
        tenantId,
        caseId,
        rows,
        plan.assignments,
        actorUserId,
      );
    }
    await tx.flush();
    return { pending, reassignedAts };
  }

  /**
   * El efecto de la asignación sobre el trabajo (nunca sobre la autoría de una cita).
   * Cada escritura se condiciona a la organización y al dueño que se fue (B-B6): si
   * la fila ya cambió de manos o se resolvió, no se toca.
   */
  private async touch(
    tx: EntityManager,
    tenantId: string,
    a: HandoverAssignment,
    actorUserId: string,
    now: Date,
  ): Promise<void> {
    const owner = { tenantId, fromUserId: a.fromUserId };
    if (a.kind === 'CONVERSATION') {
      await this.work.reassignConversation(
        tx,
        a.itemId,
        a.toUserId,
        actorUserId,
        now,
        owner,
      );
    } else if (a.kind === 'WORKFLOW_TASK') {
      await this.work.reassignTask(
        tx,
        a.itemId,
        a.toUserId,
        actorUserId,
        now,
        owner,
      );
    } else if (a.kind === 'SUPERVISED_ENGAGEMENT' && a.toUserId) {
      await this.work.setSupervisor(
        tx,
        a.itemId,
        a.toUserId,
        actorUserId,
        now,
        owner,
      );
    }
  }

  /** Estado de la fila del registro de traspaso. */
  private mark(
    row: HandoverItems,
    a: HandoverAssignment,
    actorUserId: string,
    now: Date,
  ): void {
    if (a.status === 'REASSIGNED' && a.toUserId) {
      this.lifecycle.reassign(row, {
        toUserId: a.toUserId,
        byUserId: actorUserId,
        now,
      });
    } else if (a.status === 'RETURNED_TO_POOL') {
      this.lifecycle.returnToPool(row, actorUserId, now);
    } else {
      row.statusConceptId = DELEG.HANDOVER_CLOSED;
      row.reassignedAt = now;
      row.reassignedByUserId = actorUserId;
    }
  }

  /** Aviso al responsable de seguimiento de las citas pendientes: solo identificadores. */
  private async notifyFollowUps(
    tx: EntityManager,
    tenantId: string,
    caseId: string,
    rows: readonly HandoverItems[],
    assignments: readonly HandoverAssignment[],
    actorUserId: string,
  ): Promise<void> {
    const followUps = assignments.filter(
      (a) => a.kind === 'PENDING_BOOKING' && a.toUserId,
    );
    const itemIds = followUps
      .map((a) => rows.find((r) => r.sourceId === a.itemId)?.id)
      .filter((id): id is string => !!id);
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: 'delegated_access.lifecycle.handover_completed',
      aggregateType: 'lifecycle_case',
      aggregateId: caseId,
      payloadJson: {
        tenantId,
        caseId,
        followUpItemIds: itemIds,
        followUpUserId: followUps[0]?.toUserId ?? null,
        followUpUserIds: [...new Set(followUps.map((a) => a.toUserId))],
      },
      actorUserId,
    });
  }

  private result(
    engagementId: string,
    revokedAt: Date,
    caseId: string | undefined,
    status: HandoverStatusDto['status'],
    pending: number,
  ): OffboardResultDto {
    return {
      ok: true,
      engagementId,
      revokedAt,
      ...(caseId ? { caseId } : {}),
      handover: { status, pending },
    };
  }
}

function kindOfRow(row: HandoverItems): HandoverKind {
  return KIND_BY_CONCEPT[row.itemKindConceptId] ?? 'CONVERSATION';
}
