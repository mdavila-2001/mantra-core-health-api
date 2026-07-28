import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  MarketingSegments,
  SegmentMembers,
  MarketingCampaigns,
  CampaignMembers,
  ContentTemplates,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create segment data.
 */
export interface CreateSegmentData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a segment type concept.
   */
  segmentTypeConceptId: string;
  /**
   * Valor de definition json mantenido por la instancia.
   */
  definitionJson?: unknown;
  /**
   * Identificador asociado a source read model.
   */
  sourceReadModelId?: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create segment member data.
 */
export interface CreateSegmentMemberData {
  /**
   * Identificador asociado a segment.
   */
  segmentId: string;
  /**
   * Identificador asociado a member type concept.
   */
  memberTypeConceptId: string;
  /**
   * Identificador asociado a member ref.
   */
  memberRefId: string;
  /**
   * Valor de score mantenido por la instancia.
   */
  score?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create campaign data.
 */
export interface CreateCampaignData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a campaign type concept.
   */
  campaignTypeConceptId: string;
  /**
   * Identificador asociado a objective concept.
   */
  objectiveConceptId: string;
  /**
   * Identificador asociado a channel concept.
   */
  channelConceptId?: string;
  /**
   * Identificador asociado a segment.
   */
  segmentId?: string;
  /**
   * Valor de budget amount mantenido por la instancia.
   */
  budgetAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Identificador asociado a promotion.
   */
  promotionId?: string;
  /**
   * Identificador asociado a ad campaign ref.
   */
  adCampaignRefId?: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt?: Date;
  /**
   * Valor de end at mantenido por la instancia.
   */
  endAt?: Date;
  /**
   * Identificador asociado a owner user.
   */
  ownerUserId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create campaign member data.
 */
export interface CreateCampaignMemberData {
  /**
   * Identificador asociado a campaign.
   */
  campaignId: string;
  /**
   * Identificador asociado a member type concept.
   */
  memberTypeConceptId: string;
  /**
   * Identificador asociado a member ref.
   */
  memberRefId: string;
  /**
   * Identificador asociado a member status concept.
   */
  memberStatusConceptId: string;
  /**
   * Identificador asociado a source segment member.
   */
  sourceSegmentMemberId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create content template data.
 */
export interface CreateContentTemplateData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a channel concept.
   */
  channelConceptId: string;
  /**
   * Identificador asociado a language concept.
   */
  languageConceptId?: string;
  /**
   * Valor de subject mantenido por la instancia.
   */
  subject?: string;
  /**
   * Valor de body template mantenido por la instancia.
   */
  bodyTemplate?: string;
  /**
   * Valor de variables json mantenido por la instancia.
   */
  variablesJson?: unknown;
  /**
   * Identificador asociado a messaging template.
   */
  messagingTemplateId?: string;
  /**
   * Valor de version mantenido por la instancia.
   */
  version: number;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a `marketing.segments`, `segment_members`, `marketing_campaigns`,
 * `campaign_members` y `content_templates`. Sin reglas de negocio.
 */
@Injectable()
export class MarketingCampaignsRepository {
  // --- Segmentos (UC-50-01, UC-50-02) ---

  /**
   * Crea create segment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create segment conforme al contrato `MarketingSegments`.
   */
  createSegment(em: EntityManager, data: CreateSegmentData): MarketingSegments {
    return em.create(
      MarketingSegments,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        segmentTypeConceptId: data.segmentTypeConceptId,
        definitionJson: data.definitionJson,
        sourceReadModelId: data.sourceReadModelId,
        // bigint: el modelo lo transporta como cadena decimal.
        estimatedSize: '0',
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find segment by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find segment by id conforme al contrato `Promise<MarketingSegments | null>`.
   */
  findSegmentById(
    em: EntityManager,
    id: string,
  ): Promise<MarketingSegments | null> {
    return em.findOne(MarketingSegments, { id });
  }

  /** El refresco es exclusivo por segmento: bloquear la fila evita recomputos concurrentes. */
  findSegmentForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<MarketingSegments | null> {
    return em.findOne(
      MarketingSegments,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find segment by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find segment by code conforme al contrato `Promise<MarketingSegments | null>`.
   */
  findSegmentByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<MarketingSegments | null> {
    return em.findOne(MarketingSegments, { tenantId, code });
  }

  /**
   * Crea create segment member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create segment member conforme al contrato `SegmentMembers`.
   */
  createSegmentMember(
    em: EntityManager,
    data: CreateSegmentMemberData,
  ): SegmentMembers {
    return em.create(
      SegmentMembers,
      {
        segmentId: data.segmentId,
        memberTypeConceptId: data.memberTypeConceptId,
        memberRefId: data.memberRefId,
        score: data.score,
        addedAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Membresía completa del segmento: el refresco compara contra ella para dar de baja a los que salen. */
  findSegmentMembers(
    em: EntityManager,
    segmentId: string,
  ): Promise<SegmentMembers[]> {
    return em.find(SegmentMembers, { segmentId });
  }

  /**
   * Obtiene find active segment members.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param segmentId - Identificador de segment.
   * @param activeStatusConceptId - Identificador de active status concept.
   * @returns Resultado de find active segment members conforme al contrato `Promise<SegmentMembers[]>`.
   */
  findActiveSegmentMembers(
    em: EntityManager,
    segmentId: string,
    activeStatusConceptId: string,
  ): Promise<SegmentMembers[]> {
    return em.find(SegmentMembers, {
      segmentId,
      statusConceptId: activeStatusConceptId,
    });
  }

  // --- Campañas (UC-50-03, UC-50-04) ---

  /**
   * Crea create campaign.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create campaign conforme al contrato `MarketingCampaigns`.
   */
  createCampaign(
    em: EntityManager,
    data: CreateCampaignData,
  ): MarketingCampaigns {
    return em.create(
      MarketingCampaigns,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        campaignTypeConceptId: data.campaignTypeConceptId,
        objectiveConceptId: data.objectiveConceptId,
        channelConceptId: data.channelConceptId,
        segmentId: data.segmentId,
        budgetAmount: data.budgetAmount,
        currencyConceptId: data.currencyConceptId,
        promotionId: data.promotionId,
        adCampaignRefId: data.adCampaignRefId,
        startAt: data.startAt,
        endAt: data.endAt,
        ownerUserId: data.ownerUserId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find campaign for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find campaign for update conforme al contrato `Promise<MarketingCampaigns | null>`.
   */
  findCampaignForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<MarketingCampaigns | null> {
    return em.findOne(
      MarketingCampaigns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find campaign by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find campaign by code conforme al contrato `Promise<MarketingCampaigns | null>`.
   */
  findCampaignByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<MarketingCampaigns | null> {
    return em.findOne(MarketingCampaigns, { tenantId, code });
  }

  /**
   * Crea create campaign member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create campaign member conforme al contrato `CampaignMembers`.
   */
  createCampaignMember(
    em: EntityManager,
    data: CreateCampaignMemberData,
  ): CampaignMembers {
    return em.create(
      CampaignMembers,
      {
        campaignId: data.campaignId,
        memberTypeConceptId: data.memberTypeConceptId,
        memberRefId: data.memberRefId,
        memberStatusConceptId: data.memberStatusConceptId,
        sourceSegmentMemberId: data.sourceSegmentMemberId,
        addedAt: new Date(),
        totalDispatches: 0,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Audiencia ya materializada: sirve para que UC-50-04 sea idempotente. */
  findCampaignMembers(
    em: EntityManager,
    campaignId: string,
  ): Promise<CampaignMembers[]> {
    return em.find(CampaignMembers, { campaignId });
  }

  /** Miembro de campaña por referencia polimórfica; UC-50-11 actualiza su estado. */
  findCampaignMemberByRefForUpdate(
    em: EntityManager,
    campaignId: string,
    memberTypeConceptId: string,
    memberRefId: string,
  ): Promise<CampaignMembers | null> {
    return em.findOne(
      CampaignMembers,
      { campaignId, memberTypeConceptId, memberRefId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Plantillas de contenido (UC-50-05) ---

  /**
   * Crea create content template.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create content template conforme al contrato `ContentTemplates`.
   */
  createContentTemplate(
    em: EntityManager,
    data: CreateContentTemplateData,
  ): ContentTemplates {
    return em.create(
      ContentTemplates,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        channelConceptId: data.channelConceptId,
        languageConceptId: data.languageConceptId,
        subject: data.subject,
        bodyTemplate: data.bodyTemplate,
        variablesJson: data.variablesJson,
        messagingTemplateId: data.messagingTemplateId,
        version: data.version,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Versión vigente de la plantilla, bloqueada: publicar una nueva versión archiva
   * la anterior y deriva `version = prev + 1`, y ese par no puede intercalarse.
   */
  findLatestTemplateVersionForUpdate(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<ContentTemplates | null> {
    return em.findOne(
      ContentTemplates,
      { tenantId, code },
      { orderBy: { version: 'DESC' }, lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find published template.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @param publishedStatusConceptId - Identificador de published status concept.
   * @returns Resultado de find published template conforme al contrato `Promise<ContentTemplates | null>`.
   */
  findPublishedTemplate(
    em: EntityManager,
    id: string,
    publishedStatusConceptId: string,
  ): Promise<ContentTemplates | null> {
    return em.findOne(ContentTemplates, {
      id,
      statusConceptId: publishedStatusConceptId,
    });
  }
}
