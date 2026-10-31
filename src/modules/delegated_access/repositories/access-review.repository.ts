import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy, withSystemRead } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { AccessReviewCampaigns, AccessReviewItems } from '../entities';

/** Datos para crear una campaña de certificación (en borrador). */
export interface CreateAccessReviewCampaignData {
  /** Organización (la del contexto verificado). */
  readonly tenantId: string;
  /** Nombre visible. */
  readonly name: string;
  /** Concepto del tipo (`REVIEW_KIND_*`). */
  readonly kindConceptId: string;
  /** Alcance de la campaña. */
  readonly scope: unknown;
  /** Versión del esquema del alcance. */
  readonly scopeSchemaVersion: number;
  /** Filtros adicionales. */
  readonly filters?: unknown;
  /** Fecha límite de decisión. */
  readonly dueAt: Date;
  /** Días de gracia (0-30; 7 por omisión). */
  readonly graceDays?: number;
  /** Recordatorios, en días antes del vencimiento (`[7,3,1]` por omisión). */
  readonly reminderDaysBefore?: readonly number[];
  /** Días hasta escalar (1-30; 3 por omisión). */
  readonly escalateAfterDays?: number;
  /** Qué pasa con lo no certificado (`UNCERTIFIED_*`). */
  readonly uncertifiedActionConceptId: string;
  /** Dueño de la campaña; ausente = el sistema. */
  readonly ownerUserId?: string;
  /** Quien la crea. */
  readonly actorUserId?: string;
}

/** Datos para crear un ítem de revisión. */
export interface CreateAccessReviewItemData {
  /** Organización. */
  readonly tenantId: string;
  /** Campaña a la que pertenece. */
  readonly campaignId: string;
  /** Vínculo revisado. */
  readonly organizationUserAssignmentId: string;
  /** Permiso revisado; ausente = ítem de vínculo. */
  readonly supportScopeGrantId?: string;
  /** Revisor asignado. */
  readonly reviewerUserId?: string;
  /** Concepto del tipo de revisor (`REVIEWER_KIND_*`). */
  readonly reviewerKindConceptId: string;
  /** Evidencia mostrada al revisor (identificadores y números). */
  readonly evidence: unknown;
  /** SHA-256 hexadecimal de la evidencia. */
  readonly evidenceHash: string;
  /** Fecha límite del ítem. */
  readonly dueAt: Date;
  /** Quien lo crea. */
  readonly actorUserId?: string;
}

/** Decisión de un revisor sobre un ítem. */
export interface AccessReviewDecision {
  /** Concepto de la decisión (`REVIEW_ITEM_*`). */
  readonly decisionConceptId: string;
  /** Quien decide. */
  readonly decidedByUserId?: string;
  /** Comentario (obligatorio al revocar o ajustar). */
  readonly comment?: string;
  /** Ajuste propuesto, si lo hay. */
  readonly adjustment?: unknown;
  /** Instante de la decisión. */
  readonly now: Date;
}

/** Acceso a datos de `access_review_campaigns` y `access_review_items`. */
@Injectable()
export class AccessReviewRepository {
  /**
   * Campaña por id, acotada a la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param id - Id de la campaña.
   * @returns La campaña o `null`.
   */
  findCampaignById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<AccessReviewCampaigns | null> {
    return em.findOne(AccessReviewCampaigns, { tenantId, id });
  }

  /**
   * Campañas de una organización, opcionalmente por estado; las más próximas primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param statusConceptIds - Estados buscados; ausente = todos.
   * @returns Las campañas.
   */
  findCampaigns(
    em: EntityManager,
    tenantId: string,
    statusConceptIds?: readonly string[],
  ): Promise<AccessReviewCampaigns[]> {
    return em.find(
      AccessReviewCampaigns,
      {
        tenantId,
        ...(statusConceptIds
          ? { statusConceptId: { $in: [...statusConceptIds] } }
          : {}),
      },
      { orderBy: { dueAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Crea una campaña en borrador, con los valores por omisión del contrato.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la campaña.
   * @returns La campaña creada (aún sin flush).
   */
  createCampaign(
    em: EntityManager,
    data: CreateAccessReviewCampaignData,
  ): AccessReviewCampaigns {
    return em.create(
      AccessReviewCampaigns,
      {
        tenantId: data.tenantId,
        name: data.name,
        kindConceptId: data.kindConceptId,
        scopeJson: data.scope,
        scopeSchemaVersion: data.scopeSchemaVersion,
        filtersJson: data.filters,
        dueAt: data.dueAt,
        graceDays: data.graceDays ?? 7,
        reminderDaysBeforeJson: [...(data.reminderDaysBefore ?? [7, 3, 1])],
        escalateAfterDays: data.escalateAfterDays ?? 3,
        uncertifiedActionConceptId: data.uncertifiedActionConceptId,
        ownerUserId: data.ownerUserId,
        statusConceptId: DELEG.REVIEW_CAMPAIGN_DRAFT,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Campañas abiertas de TODAS las organizaciones (solo lectura, para el
   * barrido de recordatorios y cierres). Con RLS abre el contexto de sistema
   * solo mientras lee.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param limit - Tope de filas por pasada.
   * @returns Las campañas abiertas, las más próximas a vencer primero.
   */
  findOpenCampaignsAcrossTenants(
    em: EntityManager,
    limit: number,
  ): Promise<AccessReviewCampaigns[]> {
    return withSystemRead(em, (db) =>
      db.find(
        AccessReviewCampaigns,
        { statusConceptId: DELEG.REVIEW_CAMPAIGN_OPEN },
        { orderBy: { dueAt: 'asc', id: 'asc' }, limit },
      ),
    );
  }

  /**
   * Ítems de una campaña.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param campaignId - Campaña.
   * @returns Los ítems en orden estable.
   */
  findItemsByCampaign(
    em: EntityManager,
    campaignId: string,
  ): Promise<AccessReviewItems[]> {
    return em.find(
      AccessReviewItems,
      { accessReviewCampaignId: campaignId },
      { orderBy: { dueAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Ítem por id, acotado a la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param id - Id del ítem.
   * @returns El ítem o `null`.
   */
  findItemById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<AccessReviewItems | null> {
    return em.findOne(AccessReviewItems, { tenantId, id });
  }

  /**
   * Bandeja de un revisor: sus ítems pendientes, los más urgentes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param reviewerUserId - Revisor.
   * @returns Los ítems pendientes.
   */
  findPendingForReviewer(
    em: EntityManager,
    tenantId: string,
    reviewerUserId: string,
  ): Promise<AccessReviewItems[]> {
    return em.find(
      AccessReviewItems,
      {
        tenantId,
        reviewerUserId,
        decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
      },
      { orderBy: { dueAt: 'asc', id: 'asc' } },
    );
  }

  /**
   * Crea ítems pendientes (con evidencia y hash, sin decidir).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param items - Datos de los ítems.
   * @returns Los ítems creados (aún sin flush).
   */
  createItems(
    em: EntityManager,
    items: readonly CreateAccessReviewItemData[],
  ): AccessReviewItems[] {
    return items.map((data) =>
      em.create(
        AccessReviewItems,
        {
          tenantId: data.tenantId,
          accessReviewCampaignId: data.campaignId,
          organizationUserAssignmentId: data.organizationUserAssignmentId,
          supportScopeGrantId: data.supportScopeGrantId,
          reviewerUserId: data.reviewerUserId,
          reviewerKindConceptId: data.reviewerKindConceptId,
          decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
          evidenceJson: data.evidence,
          evidenceHash: data.evidenceHash,
          dueAt: data.dueAt,
          reminderCount: 0,
          ...createdBy(data.actorUserId),
        },
        { partial: true },
      ),
    );
  }

  /**
   * Cuenta las decisiones de una campaña por concepto.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param campaignId - Campaña.
   * @returns Un mapa `decisión → cantidad`.
   */
  async decisionTally(
    em: EntityManager,
    campaignId: string,
  ): Promise<Record<string, number>> {
    const rows = await em.find(
      AccessReviewItems,
      { accessReviewCampaignId: campaignId },
      { fields: ['decisionConceptId'] },
    );
    const tally: Record<string, number> = {};
    for (const row of rows) {
      tally[row.decisionConceptId] = (tally[row.decisionConceptId] ?? 0) + 1;
    }
    return tally;
  }

  /**
   * Ítems pendientes ya vencidos de TODAS las organizaciones (solo lectura,
   * para recordatorios, escalamiento y revocación por no certificar).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param now - Instante del barrido.
   * @param limit - Tope de filas por pasada.
   * @returns Los ítems vencidos, los más antiguos primero.
   */
  findOverdueItemsAcrossTenants(
    em: EntityManager,
    now: Date,
    limit: number,
  ): Promise<AccessReviewItems[]> {
    return withSystemRead(em, (db) =>
      db.find(
        AccessReviewItems,
        { decisionConceptId: DELEG.REVIEW_ITEM_PENDING, dueAt: { $lte: now } },
        { orderBy: { dueAt: 'asc', id: 'asc' }, limit },
      ),
    );
  }

  /**
   * Bloquea el ítem (`SELECT … FOR UPDATE`) y lo relee: quien decide después
   * espera a que el primero confirme y ve su decisión (B-B3). Va PRIMERO en la
   * transacción de la decisión.
   *
   * @param em - Transacción activa.
   * @param tenantId - Organización.
   * @param id - Ítem.
   * @returns El ítem recién leído bajo bloqueo, o `null`.
   */
  lockItem(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<AccessReviewItems | null> {
    return em.findOne(
      AccessReviewItems,
      { tenantId, id },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    );
  }

  /**
   * Cuántos ítems de un vínculo siguen SIN decidir en una campaña (B-B2: el
   * vínculo solo cuenta como certificado cuando no queda ninguno).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param campaignId - Campaña.
   * @param engagementId - Vínculo.
   * @returns Los ítems pendientes de ese vínculo en esa campaña.
   */
  countUndecidedOfEngagement(
    em: EntityManager,
    tenantId: string,
    campaignId: string,
    engagementId: string,
  ): Promise<number> {
    return em.count(AccessReviewItems, {
      tenantId,
      accessReviewCampaignId: campaignId,
      organizationUserAssignmentId: engagementId,
      decisionConceptId: DELEG.REVIEW_ITEM_PENDING,
    });
  }

  /**
   * Deshace una decisión anotada de antemano cuando el efecto que la acompañaba
   * falló (B-B3): el ítem vuelve a `PENDING`, sin quién, cuándo ni comentario.
   *
   * @param row - Ítem que se había anotado.
   * @param actorUserId - Quien intentó decidir.
   * @param now - Instante.
   */
  undecide(
    row: AccessReviewItems,
    actorUserId: string | undefined,
    now: Date,
  ): void {
    row.decisionConceptId = DELEG.REVIEW_ITEM_PENDING;
    row.decidedAt = undefined;
    row.decidedByUserId = undefined;
    row.decisionCommentText = undefined;
    row.updatedAt = now;
    row.updatedByUserId = actorUserId;
  }

  /**
   * Registra la decisión de un revisor (quién, cuándo y por qué).
   *
   * @param row - Ítem que se decide.
   * @param decision - Decisión.
   */
  decide(row: AccessReviewItems, decision: AccessReviewDecision): void {
    row.decisionConceptId = decision.decisionConceptId;
    row.decidedAt = decision.now;
    row.decidedByUserId = decision.decidedByUserId;
    row.decisionCommentText = decision.comment;
    if (decision.adjustment !== undefined) {
      row.adjustmentJson = decision.adjustment;
    }
    row.updatedAt = decision.now;
    row.updatedByUserId = decision.decidedByUserId;
  }
}
