import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  canReactivate,
  canSuspend,
  checklistFor,
  reactivationReview,
  type EngagementLiveState,
} from '../domain';
import type {
  ReactivateEngagementDto,
  SuspendEngagementDto,
  SuspensionResultDto,
} from '../dto';
import {
  LifecycleRepository,
  SupportAccessRepository,
  SupportEngagementsRepository,
  type EngagementRecord,
} from '../repositories';
import { STATUS } from './concept-maps';
import { DelegationScopeService } from './delegation-scope.service';
import { EffectiveSupportAccessService } from './effective-support-access.service';
import { governanceError } from './governance-errors';
import type { LifecycleGuard } from './lifecycle-guard';
import { LifecycleFourEyes } from './lifecycle-four-eyes';
import { LifecycleReviewOpener } from './lifecycle-review-opener';
import { LifecycleSettingsReader } from './support-lifecycle-settings';
import { OutboxService } from '../../messaging/services/outbox.service';

/** Motivo con el que la recertificación vencida suspende (conserva su camino: `recertify` reactiva). */
const RECERT_LAPSED_MARKER = 'RECERTIFICATION_LAPSED';

/** Código de motivo de suspensión que acepta la ruta. */
export type SuspensionReasonCode =
  'MANUAL' | 'LEAVE' | 'INVESTIGATION' | 'INACTIVITY';

const REASON_CONCEPT: Readonly<Record<SuspensionReasonCode, string>> = {
  MANUAL: DELEG.SUSPENSION_MANUAL,
  LEAVE: DELEG.SUSPENSION_LEAVE,
  INVESTIGATION: DELEG.SUSPENSION_INVESTIGATION,
  INACTIVITY: DELEG.SUSPENSION_INACTIVITY,
};
const REASON_BY_CONCEPT: Readonly<Record<string, SuspensionReasonCode>> =
  Object.fromEntries(
    Object.entries(REASON_CONCEPT).map(([k, v]) => [
      v,
      k as SuspensionReasonCode,
    ]),
  );

/** Cuerpo firmado de una reactivación. */
export interface ReactivationPayload {
  readonly engagementId: string;
  readonly suspensionReason: SuspensionReasonCode;
  readonly reason?: string;
}

function stateOf(a: EngagementRecord['assignment']): EngagementLiveState {
  if (a.statusConceptId === STATUS.ACTIVE) return 'ACTIVE';
  if (a.statusConceptId === STATUS.SUSPENDED) return 'SUSPENDED';
  return 'ENDED';
}

/**
 * Suspensión temporal y reactivación (CONTRATO-GOBIERNO §6.1). Suspender reduce
 * acceso: es inmediato y sin aprobación; las concesiones no se tocan. Reactivar
 * aumenta acceso: siempre pasa por cuatro ojos (D-19), y por investigación solo
 * lo aprueba un administrador de seguridad.
 */
@Injectable()
export class EngagementSuspensionService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Lecturas de vínculos.
   * @param engagements - Delegaciones y membresía del vínculo.
   * @param lifecycle - Casos de ciclo de vida.
   * @param effective - Acceso efectivo derivado.
   * @param settings - Ajustes de gobierno.
   * @param fourEyes - Solicitudes de cuatro ojos.
   * @param review - Revisiones que abre el ciclo de vida.
   * @param outbox - Eventos de dominio.
   * @param scope - Organización activa verificada.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: SupportAccessRepository,
    private readonly engagements: SupportEngagementsRepository,
    private readonly lifecycle: LifecycleRepository,
    private readonly effective: EffectiveSupportAccessService,
    private readonly settings: LifecycleSettingsReader,
    private readonly fourEyes: LifecycleFourEyes,
    private readonly review: LifecycleReviewOpener,
    private readonly outbox: OutboxService,
    private readonly scope: DelegationScopeService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EngagementSuspensionService.name);
  }

  /**
   * Suspende al instante: estado, motivo, delegaciones, membresía y acceso derivado.
   *
   * @param engagementId - Vínculo.
   * @param dto - Motivo y nota.
   * @param actor - Quien suspende.
   * @param now - Reloj.
   * @param guard - Autorización del llamador, antes de escribir.
   * @returns `{ ok: true, caseId }`.
   */
  async suspend(
    engagementId: string,
    dto: SuspendEngagementDto,
    actor: AuthenticatedUser,
    now: Date = new Date(),
    guard?: LifecycleGuard,
  ): Promise<SuspensionResultDto> {
    const tenantId = this.scope.resolveTenant();
    this.logger.info(
      {
        operation: 'delegated_access.lifecycle.suspend',
        engagementId,
        tenantId,
        actorId: actor.id,
      },
      'Suspending support engagement',
    );
    return this.em.transactional(async (tx) => {
      const record = await this.load(tx, engagementId, tenantId);
      if (guard) await guard({ tenantId, em: tx, record });
      return this.apply(tx, record, dto.reasonCode, dto.note, actor.id, now);
    });
  }

  /**
   * Suspensión del sistema (inactividad, D-04): sin autor, dentro de la
   * transacción de quien la dispara (el barrido de gobierno).
   *
   * @param tx - Transacción de la organización.
   * @param tenantId - Organización.
   * @param engagementId - Vínculo.
   * @param reasonCode - Motivo (`INACTIVITY`).
   * @param now - Reloj.
   * @returns `{ ok: true, caseId }`.
   */
  async suspendSystem(
    tx: EntityManager,
    tenantId: string,
    engagementId: string,
    reasonCode: SuspensionReasonCode,
    now: Date,
  ): Promise<SuspensionResultDto> {
    const record = await this.load(tx, engagementId, tenantId);
    return this.apply(tx, record, reasonCode, undefined, undefined, now);
  }

  /**
   * Pide reactivar: crea el cuatro ojos y no cambia nada hasta que otra persona apruebe.
   *
   * @param engagementId - Vínculo suspendido.
   * @param dto - Motivo.
   * @param actor - Quien lo pide.
   * @param now - Reloj.
   * @param guard - Autorización del llamador, antes de escribir.
   * @returns La solicitud pendiente.
   */
  async reactivate(
    engagementId: string,
    dto: ReactivateEngagementDto,
    actor: AuthenticatedUser,
    now: Date = new Date(),
    guard?: LifecycleGuard,
  ): Promise<SuspensionResultDto> {
    const tenantId = this.scope.resolveTenant();
    return this.em.transactional(async (tx) => {
      const record = await this.load(tx, engagementId, tenantId);
      if (guard) await guard({ tenantId, em: tx, record });
      const a = record.assignment;
      const verdict = canReactivate(stateOf(a));
      const lapsed = a.endedReasonText === RECERT_LAPSED_MARKER;
      if (!verdict.ok || lapsed) {
        throw governanceError(
          !verdict.ok && verdict.reason === 'SUPPORT_ENGAGEMENT_NOT_ACTIVE'
            ? Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE
            : Reason.ENGAGEMENT_NOT_SUSPENDED,
          lapsed
            ? 'Está suspendido por no recertificarse: recertifíquelo para reactivarlo.'
            : 'Solo se reactiva a una persona suspendida.',
        );
      }
      const payload: ReactivationPayload = {
        engagementId,
        suspensionReason:
          (a.suspensionReasonConceptId &&
            REASON_BY_CONCEPT[a.suspensionReasonConceptId]) ||
          'MANUAL',
        reason: dto.reason,
      };
      const created = await this.fourEyes.request(
        tx,
        {
          tenantId,
          kind: 'REACTIVATION',
          actor,
          subjectUserId: record.userId,
          engagementId,
          payload: { ...payload },
          reasonText: dto.reason,
        },
        now,
      );
      return {
        status: 'PENDING_APPROVAL',
        approvalId: created.approvalId,
        expiresAt: created.expiresAt,
      };
    });
  }

  /**
   * Ejecuta la reactivación aprobada: estado activo, delegaciones y membresía
   * reactivadas, `next_recertification_at` intacto; tras más de 60 días suspendida
   * abre además una revisión dirigida para el dueño.
   *
   * @param tx - Transacción de la aprobación.
   * @param tenantId - Organización.
   * @param payload - Cuerpo firmado.
   * @param requesterUserId - Quien pidió.
   * @param approverUserId - Quien aprobó.
   * @param now - Reloj.
   * @returns El resultado, con identificadores.
   * @throws DomainException 409 `FOUR_EYES_PAYLOAD_INVALID` si ya no está suspendido.
   */
  async executeReactivation(
    tx: EntityManager,
    tenantId: string,
    payload: ReactivationPayload,
    requesterUserId: string,
    approverUserId: string,
    now: Date = new Date(),
  ): Promise<{
    reactivated: boolean;
    reviewOpened: boolean;
    caseId?: string;
    campaignId?: string;
  }> {
    const record = await this.load(tx, payload.engagementId, tenantId);
    const a = record.assignment;
    if (
      stateOf(a) !== 'SUSPENDED' ||
      a.endedReasonText === RECERT_LAPSED_MARKER
    ) {
      throw governanceError(
        Reason.FOUR_EYES_PAYLOAD_INVALID,
        'El vínculo ya no está suspendido: no hay nada que reactivar.',
      );
    }
    const suspendedAt = a.suspendedAt;
    a.statusConceptId = STATUS.ACTIVE;
    a.suspendedAt = undefined;
    a.suspensionReasonConceptId = undefined;
    a.suspensionNoteText = undefined;
    touch(a, approverUserId, now);
    for (const d of await this.engagements.findDelegations(tx, a.id)) {
      if (d.statusConceptId === STATUS.SUSPENDED) {
        d.statusConceptId = STATUS.ACTIVE;
        touch(d, approverUserId, now);
      }
    }
    await this.engagements.syncSupportMembership(
      tx,
      a.tenantMembershipId,
      'ACTIVE',
      now,
      approverUserId,
    );
    await tx.flush();
    await this.effective.refreshTenant(tenantId, {
      userId: record.userId,
      actorUserId: approverUserId,
      tx,
    });
    const caseId = await this.closedCase(
      tx,
      record,
      'REACTIVATION',
      requesterUserId,
      now,
    );
    const settings = await this.settings.forTenant(tx, tenantId, now);
    const rule = suspendedAt
      ? reactivationReview({
          suspendedAt,
          reactivatedAt: now,
          afterDays: settings.suspensionReviewAfterDays,
        })
      : undefined;
    let campaignId: string | undefined;
    if (rule?.opensReview) {
      const opened = await this.review.open(
        tx,
        {
          tenantId,
          kind: 'TARGETED',
          name: 'Revisión tras reactivación',
          dueDays: rule.dueDays,
          engagementId: a.id,
          reviewerUserId: a.supervisorUserId ?? undefined,
          actorUserId: approverUserId,
          items: [
            {
              evidence: {
                daysSuspended: rule.daysSuspended,
                reactivatedByUserId: approverUserId,
              },
            },
          ],
        },
        now,
      );
      campaignId = opened.campaignId;
    }
    await this.publish(tx, tenantId, 'reactivated', a.id, approverUserId);
    return {
      reactivated: true,
      reviewOpened: !!rule?.opensReview,
      caseId,
      campaignId,
    };
  }

  /** Suspende y deja el caso `SUSPENSION` completado. */
  private async apply(
    tx: EntityManager,
    record: EngagementRecord,
    reasonCode: SuspensionReasonCode,
    note: string | undefined,
    actorUserId: string | undefined,
    now: Date,
  ): Promise<SuspensionResultDto> {
    const a = record.assignment;
    const verdict = canSuspend(stateOf(a));
    if (!verdict.ok) {
      throw governanceError(
        verdict.reason === 'ENGAGEMENT_ALREADY_SUSPENDED'
          ? Reason.ENGAGEMENT_ALREADY_SUSPENDED
          : Reason.SUPPORT_ENGAGEMENT_NOT_ACTIVE,
        verdict.reason === 'ENGAGEMENT_ALREADY_SUSPENDED'
          ? 'La persona ya está suspendida.'
          : 'El vínculo de apoyo no está activo.',
      );
    }
    a.statusConceptId = STATUS.SUSPENDED;
    a.suspendedAt = now;
    a.suspensionReasonConceptId = REASON_CONCEPT[reasonCode];
    a.suspensionNoteText = note;
    touch(a, actorUserId, now);
    for (const d of await this.engagements.findDelegations(tx, a.id)) {
      if (d.statusConceptId === STATUS.ACTIVE) {
        d.statusConceptId = STATUS.SUSPENDED;
        touch(d, actorUserId, now);
      }
    }
    await this.engagements.syncSupportMembership(
      tx,
      a.tenantMembershipId,
      'SUSPENDED',
      now,
      actorUserId,
    );
    await tx.flush();
    await this.effective.refreshTenant(record.tenantId, {
      userId: record.userId,
      actorUserId,
      tx,
    });
    const caseId = await this.closedCase(
      tx,
      record,
      'SUSPENSION',
      actorUserId,
      now,
      note,
    );
    await this.publish(tx, record.tenantId, 'suspended', a.id, actorUserId);
    return { ok: true, caseId };
  }

  /** Caso de un solo paso, ya completado (todo lo que lo compone lo hizo esta operación). */
  private async closedCase(
    tx: EntityManager,
    record: EngagementRecord,
    kind: 'SUSPENSION' | 'REACTIVATION',
    openedBy: string | undefined,
    now: Date,
    reason?: string,
  ): Promise<string> {
    const kase = this.lifecycle.createCase(tx, {
      tenantId: record.tenantId,
      organizationUserAssignmentId: record.assignment.id,
      subjectUserId: record.userId,
      kindConceptId:
        kind === 'SUSPENSION'
          ? DELEG.LIFECYCLE_SUSPENSION
          : DELEG.LIFECYCLE_REACTIVATION,
      openedByUserId: openedBy,
      openedAt: now,
      reasonText: reason,
      checklist: checklistFor(kind).map((i) => ({
        ...i,
        status: 'DONE' as const,
        completedAt: now,
      })),
      actorUserId: openedBy,
    });
    this.lifecycle.complete(kase, now, openedBy);
    await tx.flush();
    return kase.id;
  }

  private async load(
    tx: EntityManager,
    engagementId: string,
    tenantId: string,
  ): Promise<EngagementRecord> {
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
    return record;
  }

  private async publish(
    tx: EntityManager,
    tenantId: string,
    type: 'suspended' | 'reactivated',
    engagementId: string,
    actorUserId: string | undefined,
  ): Promise<void> {
    await this.outbox.publishDomainEvent(tx, {
      tenantId,
      eventType: `delegated_access.lifecycle.${type}`,
      aggregateType: 'organization_user_assignment',
      aggregateId: engagementId,
      payloadJson: { tenantId, engagementId },
      ...(actorUserId ? { actorUserId } : {}),
    });
  }
}
