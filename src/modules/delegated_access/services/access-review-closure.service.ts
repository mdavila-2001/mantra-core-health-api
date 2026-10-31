import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch, type AuthenticatedUser } from '../../../common';
import { planCampaignClosure, type ClosureItem } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import type { AccessReviewCampaigns } from '../entities';
import {
  AccessReviewRepository,
  SupportGrantsRepository,
} from '../repositories';
import {
  ITEM_STATE_BY_CONCEPT,
  ITEM_STATE_CONCEPT,
  REVIEW_KIND_BY_CONCEPT,
  uncertifiedActionOf,
} from './access-review-concepts';
import { EffectiveSupportAccessService } from './effective-support-access.service';
import { GovernanceAudit } from './governance-audit';
import { GovernanceEvents, GovernanceEventType } from './governance-events';
import { GovernanceWorldLoader } from './governance-world.loader';
import { ReviewerResolverService } from './reviewer-resolver.service';

/** Qué quedó al cerrar una campaña. */
export interface CloseOutcome {
  readonly closed: boolean;
  readonly reason?: string;
  readonly autoRevoked: number;
  readonly skipped: number;
}

/**
 * Cierre de campañas (CONTRATO-GOBIERNO §6.2, D-09): con `UNCERTIFIED_REVOKE`
 * cada ítem pendiente pasa a `AUTO_REVOKED` —la concesión se revoca, el vínculo
 * no— y se avisa a la persona, su dueño y el doctor; con `UNCERTIFIED_ESCALATE`
 * solo se cierra a mano y no cambia nada. Los ítems de vínculos terminados o
 * suspendidos, las concesiones ya revocadas y los ítems de recertificación de
 * vínculo (que cierra el barrido de recertificación existente) se omiten.
 */
@Injectable()
export class AccessReviewClosureService {
  /**
   * @param repo - Campañas e ítems.
   * @param grants - Concesiones de apoyo.
   * @param loader - Hechos de gobierno de la organización.
   * @param resolver - Hechos de resolución de revisores (cuentas de los doctores).
   * @param events - Eventos de dominio (outbox).
   * @param audit - Sello de auditoría con su nombre de negocio.
   * @param effective - Acceso efectivo derivado.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly repo: AccessReviewRepository,
    private readonly grants: SupportGrantsRepository,
    private readonly loader: GovernanceWorldLoader,
    private readonly resolver: ReviewerResolverService,
    private readonly events: GovernanceEvents,
    private readonly audit: GovernanceAudit,
    private readonly effective: EffectiveSupportAccessService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccessReviewClosureService.name);
  }

  /**
   * Cierra una campaña abierta según su acción para lo no certificado.
   *
   * @param tx - Transacción de la organización de la campaña.
   * @param campaign - Campaña abierta.
   * @param now - Instante del cierre.
   * @param opts - `manual` = cierre pedido por una persona (`POST …/close`); si no, el del barrido a `due_at + días de gracia`.
   * @returns Si cerró y cuántos ítems se auto-revocaron u omitieron.
   */
  async close(
    tx: EntityManager,
    campaign: AccessReviewCampaigns,
    now: Date,
    opts: {
      readonly manual: boolean;
      readonly actorUserId?: string;
      /** Quien cierra; en el barrido, la cuenta de sistema que lo dispara. */
      readonly actor?: AuthenticatedUser;
    },
  ): Promise<CloseOutcome> {
    const rows = await this.repo.findItemsByCampaign(tx, campaign.id);
    const world = await this.loader.load(tx, campaign.tenantId, now, [
      ...new Set(rows.map((r) => r.organizationUserAssignmentId)),
    ]);
    const facts = await this.resolver.factsFor(tx, world, campaign.ownerUserId);
    const accounts = facts.context.doctorUserIdsByPractitioner ?? {};
    const closure: ClosureItem[] = rows.map((r) => {
      const e = world.engagements.find(
        (x) => x.engagementId === r.organizationUserAssignmentId,
      );
      const g = r.supportScopeGrantId
        ? e?.grants.find((x) => x.grantId === r.supportScopeGrantId)
        : undefined;
      const doctors = g
        ? [g.practitionerProfileId, g.practitionerRoleAssignmentId]
            .map((p) => (p ? accounts[p] : undefined))
            .filter((u): u is string => !!u)
        : [];
      return {
        itemId: r.id,
        state: ITEM_STATE_BY_CONCEPT[r.decisionConceptId] ?? 'PENDING',
        isEngagementItem: !r.supportScopeGrantId,
        engagementState: e?.state ?? 'ENDED',
        grantRevoked: !!r.supportScopeGrantId && (!g || g.active === false),
        subjectUserId: e?.subjectUserId ?? '',
        supervisorUserId: e?.supervisorUserId ?? null,
        doctorUserIds: doctors,
      };
    });
    const plan = planCampaignClosure({
      campaign: {
        name: campaign.name,
        kind: REVIEW_KIND_BY_CONCEPT[campaign.kindConceptId] ?? 'PERIODIC',
        status: 'OPEN',
        dueAt: campaign.dueAt,
        graceDays: campaign.graceDays,
        uncertifiedAction: uncertifiedActionOf(
          campaign.uncertifiedActionConceptId,
        ),
      },
      items: closure,
      now,
      manual: opts.manual,
    });
    if (!plan.closes) {
      return { closed: false, reason: plan.reason, autoRevoked: 0, skipped: 0 };
    }
    let autoRevoked = 0;
    let skipped = 0;
    const affected = new Set<string>();
    for (const action of plan.actions) {
      const row = rows.find((r) => r.id === action.itemId)!;
      if (action.to === 'SKIPPED') {
        this.repo.decide(row, {
          decisionConceptId: ITEM_STATE_CONCEPT.SKIPPED,
          now,
        });
        skipped += 1;
        continue;
      }
      const grant = row.supportScopeGrantId
        ? await this.grants.findById(tx, row.supportScopeGrantId)
        : null;
      if (grant && grant.statusConceptId !== DELEG.SUPPORT_GRANT_REVOKED) {
        grant.statusConceptId = DELEG.SUPPORT_GRANT_REVOKED;
        grant.validTo = now;
        touch(grant, opts.actorUserId, now);
      }
      this.repo.decide(row, {
        decisionConceptId: ITEM_STATE_CONCEPT.AUTO_REVOKED,
        comment: action.endedReason,
        now,
      });
      autoRevoked += 1;
      const subject = closure.find((c) => c.itemId === row.id)?.subjectUserId;
      if (subject) affected.add(subject);
      await this.audit.seal(
        tx,
        opts.actor,
        campaign.tenantId,
        'ACCESS_REVIEW_ITEM_AUTO_REVOKED',
        'access_review_item',
        row.id,
      );
      await this.events.publish(tx, {
        tenantId: campaign.tenantId,
        type: GovernanceEventType.autoRevoked,
        aggregate: 'access_review_item',
        aggregateId: row.id,
        payload: {
          campaignId: campaign.id,
          itemId: row.id,
          grantId: row.supportScopeGrantId,
          userId: subject,
          notifyUserIds: [...action.notifyUserIds],
        },
        actorUserId: opts.actorUserId,
      });
    }
    campaign.statusConceptId = DELEG.REVIEW_CAMPAIGN_CLOSED;
    campaign.closedAt = now;
    touch(campaign, opts.actorUserId, now);
    await tx.flush();
    for (const userId of affected) {
      await this.effective.refreshTenant(campaign.tenantId, {
        userId,
        actorUserId: opts.actorUserId,
        tx,
      });
    }
    await this.events.publish(tx, {
      tenantId: campaign.tenantId,
      type: GovernanceEventType.campaignClosed,
      aggregate: 'access_review_campaign',
      aggregateId: campaign.id,
      payload: { campaignId: campaign.id, autoRevoked, skipped },
      actorUserId: opts.actorUserId,
    });
    this.logger.info(
      {
        operation: 'delegated_access.access_review.close',
        campaignId: campaign.id,
        autoRevoked,
        skipped,
        manual: opts.manual,
      },
      'Access review campaign closed',
    );
    return { closed: true, autoRevoked, skipped };
  }
}
