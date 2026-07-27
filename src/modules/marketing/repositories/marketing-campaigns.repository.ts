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

export interface CreateSegmentData {
  tenantId: string;
  code: string;
  name: string;
  segmentTypeConceptId: string;
  definitionJson?: unknown;
  sourceReadModelId?: string;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateSegmentMemberData {
  segmentId: string;
  memberTypeConceptId: string;
  memberRefId: string;
  score?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateCampaignData {
  tenantId: string;
  code: string;
  name: string;
  campaignTypeConceptId: string;
  objectiveConceptId: string;
  channelConceptId?: string;
  segmentId?: string;
  budgetAmount?: string;
  currencyConceptId?: string;
  promotionId?: string;
  adCampaignRefId?: string;
  startAt?: Date;
  endAt?: Date;
  ownerUserId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateCampaignMemberData {
  campaignId: string;
  memberTypeConceptId: string;
  memberRefId: string;
  memberStatusConceptId: string;
  sourceSegmentMemberId?: string;
  actorUserId?: string;
}

export interface CreateContentTemplateData {
  tenantId: string;
  code: string;
  name: string;
  channelConceptId: string;
  languageConceptId?: string;
  subject?: string;
  bodyTemplate?: string;
  variablesJson?: unknown;
  messagingTemplateId?: string;
  version: number;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a `marketing.segments`, `segment_members`, `marketing_campaigns`,
 * `campaign_members` y `content_templates`. Sin reglas de negocio.
 */
@Injectable()
export class MarketingCampaignsRepository {
  // --- Segmentos (UC-50-01, UC-50-02) ---

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

  findSegmentByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<MarketingSegments | null> {
    return em.findOne(MarketingSegments, { tenantId, code });
  }

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

  findCampaignByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<MarketingCampaigns | null> {
    return em.findOne(MarketingCampaigns, { tenantId, code });
  }

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
