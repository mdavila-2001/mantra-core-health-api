import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { touch } from '../../../common';
import { buildReviewEvidence, type CampaignItemDraft } from '../domain';
import { DELEG } from '../delegated_access.concepts';
import type { AccessReviewCampaigns } from '../entities';
import {
  AccessAnomaliesRepository,
  AccessReviewRepository,
  GovernanceQueriesRepository,
} from '../repositories';
import { REVIEWER_KIND_CONCEPT } from './access-review-concepts';
import {
  buildEngagementEvidence,
  hashEvidenceObject,
  sodOfGrant,
  usageOfGrant,
  withRouting,
} from './access-review-evidence';
import { GovernanceEvents, GovernanceEventType } from './governance-events';
import type { GovernanceWorld } from './governance-world';

const DAY_MS = 86_400_000;

/** Cómo crear los ítems de una campaña. */
export interface OpenItemsOptions {
  /** Abre la campaña (borrador → abierta) y publica el evento de lanzamiento. */
  readonly activate: boolean;
  /** Quien lanza; ausente = el sistema. */
  readonly actorUserId?: string;
  /** Vencimiento propio de cada ítem (la recertificación vence en su fecha). */
  readonly dueAtOf?: (draft: CampaignItemDraft) => Date | undefined;
}

/**
 * Crea los ítems de una campaña con su evidencia congelada: uso de 90 días,
 * alertas abiertas, conflictos de segregación, techo y última certificación.
 * Guarda el `evidence_hash` (SHA-256 de lo que se mostró) para no repudio y,
 * aparte del hash, a quién se asignó cada ítem.
 */
@Injectable()
export class AccessReviewItemFactory {
  /**
   * @param repo - Campañas e ítems.
   * @param queries - Uso por concesión.
   * @param anomalies - Alertas abiertas de las personas.
   * @param events - Eventos de dominio (outbox).
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly repo: AccessReviewRepository,
    private readonly queries: GovernanceQueriesRepository,
    private readonly anomalies: AccessAnomaliesRepository,
    private readonly events: GovernanceEvents,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccessReviewItemFactory.name);
  }

  /**
   * Crea los ítems y, si se pide, abre la campaña.
   *
   * @param tx - Transacción de la organización.
   * @param campaign - Campaña (borrador o abierta).
   * @param world - Hechos de la organización.
   * @param drafts - Ítems por crear (de `selectCampaignItems`).
   * @param now - Instante.
   * @param opts - Apertura, autor y vencimientos propios.
   * @returns Cuántos ítems se crearon y cuántos quedaron sin revisor elegible.
   */
  async open(
    tx: EntityManager,
    campaign: AccessReviewCampaigns,
    world: GovernanceWorld,
    drafts: readonly CampaignItemDraft[],
    now: Date,
    opts: OpenItemsOptions,
  ): Promise<{ created: number; unresolved: number }> {
    const grantIds = new Set<string>();
    for (const d of drafts) {
      if (d.grantId) grantIds.add(d.grantId);
      else {
        const e = world.engagements.find(
          (x) => x.engagementId === d.engagementId,
        );
        for (const g of e?.grants ?? []) grantIds.add(g.grantId);
      }
    }
    const usage = await this.queries.usageByGrant(
      tx,
      world.tenantId,
      [...grantIds],
      new Date(now.getTime() - 90 * DAY_MS),
    );
    const open = await this.anomalies.findByTenant(tx, world.tenantId, {
      statusConceptIds: [DELEG.ANOMALY_OPEN],
    });
    const alertsOf = (userId: string): number =>
      open.filter((a) => a.userId === userId).length;
    const data = drafts.map((d) => {
      const e = world.engagements.find(
        (x) => x.engagementId === d.engagementId,
      )!;
      const g = d.grantId
        ? e.grants.find((x) => x.grantId === d.grantId)
        : undefined;
      const evidence: object = g
        ? buildReviewEvidence({
            grant: g,
            usage90d: usageOfGrant(usage, g.grantId),
            openAlerts: alertsOf(e.subjectUserId),
            sodFindings: sodOfGrant(e.sodFindings, g.grantId),
            aboveCeiling: g.aboveCeiling,
            lastCertifiedAt: e.lastCertifiedAt,
            now,
          })
        : buildEngagementEvidence({
            engagement: e,
            usage,
            openAlerts: alertsOf(e.subjectUserId),
            now,
          });
      return {
        tenantId: world.tenantId,
        campaignId: campaign.id,
        organizationUserAssignmentId: d.engagementId,
        supportScopeGrantId: d.grantId ?? undefined,
        reviewerUserId: d.reviewerUserIds[0],
        reviewerKindConceptId: REVIEWER_KIND_CONCEPT[d.reviewerKind],
        evidence: withRouting(evidence, {
          reviewerKind: d.reviewerKind,
          reviewerUserIds: d.reviewerUserIds,
        }),
        evidenceHash: hashEvidenceObject(evidence),
        dueAt: opts.dueAtOf?.(d) ?? campaign.dueAt,
        actorUserId: opts.actorUserId,
      };
    });
    // La campaña (creada por quien llama con `em.create`) tiene que existir en la base
    // antes que sus ítems: `access_review_campaign_id` es una FK sin relación mapeada en el
    // ORM y el orden del commit entre tablas no está garantizado (23503 en una base real).
    await tx.flush();
    this.repo.createItems(tx, data);
    if (opts.activate) {
      campaign.statusConceptId = DELEG.REVIEW_CAMPAIGN_OPEN;
      campaign.launchedAt = now;
      touch(campaign, opts.actorUserId, now);
    }
    await tx.flush();
    const unresolved = drafts.filter((d) => d.unresolvedReviewer).length;
    if (opts.activate) {
      await this.events.publish(tx, {
        tenantId: world.tenantId,
        type: GovernanceEventType.campaignLaunched,
        aggregate: 'access_review_campaign',
        aggregateId: campaign.id,
        payload: {
          campaignId: campaign.id,
          itemCount: data.length,
          withoutReviewer: unresolved,
        },
        actorUserId: opts.actorUserId,
      });
    }
    this.logger.info(
      {
        operation: 'delegated_access.access_review.items_created',
        campaignId: campaign.id,
        items: data.length,
        unresolved,
      },
      'Access review items created',
    );
    return { created: data.length, unresolved };
  }
}
