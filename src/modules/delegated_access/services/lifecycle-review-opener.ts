import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../messaging/services/outbox.service';
import { DELEG } from '../delegated_access.concepts';
import { canonicalJson, sha256Hex } from '../domain';
import { AccessReviewRepository } from '../repositories';
import { REVIEWER_KIND_CONCEPT } from './access-review-concepts';

const DAY_MS = 86_400_000;

/** Versión del esquema de `scope_json` de estas campañas. */
const SCOPE_SCHEMA_VERSION = 1;

/** Una revisión que abre el ciclo de vida: tras un cambio de rol o una reactivación larga. */
export interface LifecycleReviewInput {
  readonly tenantId: string;
  /** `MOVER` (un ítem por concesión nueva) o `TARGETED` (reactivación tras mucho tiempo). */
  readonly kind: 'MOVER' | 'TARGETED';
  readonly name: string;
  readonly dueDays: number;
  readonly engagementId: string;
  /** Revisor: el dueño de la cuenta; sin él, el ítem va al administrador. */
  readonly reviewerUserId?: string;
  readonly actorUserId?: string;
  /** Un ítem por entrada; sin `grantId` es un ítem de vínculo. `evidence` lleva solo identificadores y números. */
  readonly items: ReadonlyArray<{
    readonly grantId?: string;
    readonly evidence: unknown;
    /** Revisor propio de este ítem (p. ej. el doctor de la concesión); sin él, el de la campaña. */
    readonly reviewerUserId?: string;
    /** Clase de revisor del ítem; sin ella, `SUPERVISOR` si hay persona y `ADMIN` si no. */
    readonly reviewerKind?:
      'DOCTOR_OWNER' | 'SERVICE_HEAD' | 'SUPERVISOR' | 'ADMIN';
  }>;
}

/**
 * Abre campañas de revisión del ciclo de vida con el repositorio de campañas:
 * nacen ya abiertas, con acción al vencer `UNCERTIFIED_ESCALATE` (una segunda
 * mirada a algo que un administrador acaba de decidir, no una revocación). Los
 * recordatorios, escalamientos y cierres los atiende el barrido de campañas.
 */
@Injectable()
export class LifecycleReviewOpener {
  /**
   * @param reviews - Campañas e ítems de revisión.
   * @param outbox - Eventos de dominio.
   */
  constructor(
    private readonly reviews: AccessReviewRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Abre la campaña y sus ítems dentro de la transacción de quien la pide.
   *
   * @param tx - Transacción activa.
   * @param input - Qué se revisa y quién revisa.
   * @param now - Reloj.
   * @returns La campaña y cuántos ítems tiene; sin ítems no se abre nada.
   */
  async open(
    tx: EntityManager,
    input: LifecycleReviewInput,
    now: Date = new Date(),
  ): Promise<{ campaignId?: string; itemCount: number }> {
    if (input.items.length === 0)
      return { campaignId: undefined, itemCount: 0 };
    const dueAt = new Date(now.getTime() + input.dueDays * DAY_MS);
    const campaign = this.reviews.createCampaign(tx, {
      tenantId: input.tenantId,
      name: input.name,
      kindConceptId:
        input.kind === 'MOVER'
          ? DELEG.REVIEW_KIND_MOVER
          : DELEG.REVIEW_KIND_TARGETED,
      scope: { kind: 'ORGANIZATION', engagementId: input.engagementId },
      scopeSchemaVersion: SCOPE_SCHEMA_VERSION,
      dueAt,
      uncertifiedActionConceptId: DELEG.UNCERTIFIED_ESCALATE,
      ownerUserId: input.reviewerUserId,
      actorUserId: input.actorUserId,
    });
    campaign.statusConceptId = DELEG.REVIEW_CAMPAIGN_OPEN;
    campaign.launchedAt = now;
    await tx.flush();
    this.reviews.createItems(
      tx,
      input.items.map((item) => {
        const reviewerUserId =
          item.reviewerKind === 'ADMIN'
            ? undefined
            : (item.reviewerUserId ?? input.reviewerUserId);
        const kind =
          item.reviewerKind ?? (reviewerUserId ? 'SUPERVISOR' : 'ADMIN');
        return {
          tenantId: input.tenantId,
          campaignId: campaign.id,
          organizationUserAssignmentId: input.engagementId,
          supportScopeGrantId: item.grantId,
          reviewerUserId,
          reviewerKindConceptId: REVIEWER_KIND_CONCEPT[kind],
          evidence: item.evidence,
          evidenceHash: sha256Hex(canonicalJson(item.evidence)),
          dueAt,
          actorUserId: input.actorUserId,
        };
      }),
    );
    await tx.flush();
    await this.outbox.publishDomainEvent(tx, {
      tenantId: input.tenantId,
      eventType: 'delegated_access.access_review.campaign_launched',
      aggregateType: 'access_review_campaign',
      aggregateId: campaign.id,
      payloadJson: {
        tenantId: input.tenantId,
        campaignId: campaign.id,
        kind: input.kind,
        engagementId: input.engagementId,
        itemCount: input.items.length,
      },
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
    });
    return { campaignId: campaign.id, itemCount: input.items.length };
  }
}
