import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { MarketingCampaignsRepository } from '../repositories';
import {
  CreateSegmentDto,
  SegmentResponseDto,
  RefreshSegmentDto,
  RefreshSegmentResponseDto,
  CreateCampaignDto,
  CampaignResponseDto,
  MaterializeMembersDto,
  MaterializeMembersResponseDto,
  PublishTemplateVersionDto,
  TemplateVersionResponseDto,
  type SegmentType,
  type MemberType,
  type MarketingChannel,
  type CampaignType,
  type CampaignObjective,
} from '../dto';

const SEGMENT_TYPE_CONCEPT: Readonly<Record<SegmentType, string>> = {
  DYNAMIC: CONCEPTS.SEGMENT_DYNAMIC,
  STATIC: CONCEPTS.SEGMENT_STATIC,
};

export const MEMBER_TYPE_CONCEPT: Readonly<Record<MemberType, string>> = {
  CONTACT: CONCEPTS.MEMBER_CONTACT,
  PATIENT: CONCEPTS.MEMBER_PATIENT,
};

export const CHANNEL_CONCEPT: Readonly<Record<MarketingChannel, string>> = {
  EMAIL: CONCEPTS.CH_EMAIL,
  SMS: CONCEPTS.CH_SMS,
  PUSH: CONCEPTS.CH_PUSH,
};

const CAMPAIGN_TYPE_CONCEPT: Readonly<Record<CampaignType, string>> = {
  ONE_SHOT: CONCEPTS.CAMPAIGN_TYPE_ONE_SHOT,
  RECURRING: CONCEPTS.CAMPAIGN_TYPE_RECURRING,
};

const OBJECTIVE_CONCEPT: Readonly<Record<CampaignObjective, string>> = {
  AWARENESS: CONCEPTS.OBJECTIVE_AWARENESS,
  CONVERSION: CONCEPTS.OBJECTIVE_CONVERSION,
  RETENTION: CONCEPTS.OBJECTIVE_RETENTION,
};

/** Estados de campaña que aceptan materializar audiencia (UC-50-04). */
const MATERIALIZABLE_CAMPAIGN_STATES: readonly string[] = [
  CONCEPTS.CAMPAIGN_SCHEDULED,
  CONCEPTS.CAMPAIGN_RUNNING,
];

/**
 * Segmentos, campañas y plantillas de contenido
 * (UC-50-01, UC-50-02, UC-50-03, UC-50-04, UC-50-05).
 */
@Injectable()
export class MarketingCampaignsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param campaignsRepo - Valor de campaigns repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly campaignsRepo: MarketingCampaignsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MarketingCampaignsService.name);
  }

  /** UC-50-01: crear el segmento y ligarlo a su read model. */
  async createSegment(
    dto: CreateSegmentDto,
    actor: AuthenticatedUser,
  ): Promise<SegmentResponseDto> {
    this.logger.info(
      {
        operation: 'marketing.segment.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Creating marketing segment',
    );

    const duplicate = await this.campaignsRepo.findSegmentByCode(
      this.em,
      dto.tenantId,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe un segmento con ese código', {
        tenantId: dto.tenantId,
        code: dto.code,
      });
    }

    return this.em.transactional(async (tx) => {
      const segment = this.campaignsRepo.createSegment(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        segmentTypeConceptId: SEGMENT_TYPE_CONCEPT[dto.segmentType],
        definitionJson: dto.definitionJson,
        sourceReadModelId: dto.sourceReadModelId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: segment.id,
        code: dto.code,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
      };
    });
  }

  /**
   * UC-50-02: recomputar la membresía. El cuerpo trae la membresía **completa**:
   * quien no aparece sale del segmento (baja lógica, no borrado, para conservar
   * la trazabilidad de a quién se contactó alguna vez).
   */
  async refreshSegment(
    segmentId: string,
    dto: RefreshSegmentDto,
    actor: AuthenticatedUser,
  ): Promise<RefreshSegmentResponseDto> {
    this.logger.info(
      {
        operation: 'marketing.segment.refresh',
        segmentId,
        incoming: dto.members.length,
      },
      'Refreshing segment membership',
    );

    return this.em.transactional(async (tx) => {
      // El bloqueo del segmento es lo que serializa refrescos concurrentes.
      const segment = await this.campaignsRepo.findSegmentForUpdate(
        tx,
        segmentId,
      );
      if (!segment) {
        throw new ResourceNotFoundException('Segmento no encontrado', {
          segmentId,
        });
      }
      if (segment.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El segmento no está activo', {
          segmentId,
        });
      }

      const existing = await this.campaignsRepo.findSegmentMembers(
        tx,
        segmentId,
      );
      const byKey = new Map(
        existing.map((m) => [`${m.memberTypeConceptId}:${m.memberRefId}`, m]),
      );

      let added = 0;
      const incomingKeys = new Set<string>();
      for (const member of dto.members) {
        const typeConceptId = MEMBER_TYPE_CONCEPT[member.memberType];
        const key = `${typeConceptId}:${member.memberRefId}`;
        incomingKeys.add(key);

        const current = byKey.get(key);
        if (current) {
          // Reingreso: quien había salido vuelve a contar como miembro activo.
          if (current.statusConceptId !== CONCEPTS.SEGMENT_MEMBER_ACTIVE) {
            current.statusConceptId = CONCEPTS.SEGMENT_MEMBER_ACTIVE;
            current.addedAt = new Date();
            added += 1;
          }
          current.score = member.score;
          touch(current, actor.id);
          continue;
        }

        this.campaignsRepo.createSegmentMember(tx, {
          segmentId,
          memberTypeConceptId: typeConceptId,
          memberRefId: member.memberRefId,
          score: member.score,
          statusConceptId: CONCEPTS.SEGMENT_MEMBER_ACTIVE,
          actorUserId: actor.id,
        });
        added += 1;
      }

      let removed = 0;
      for (const [key, member] of byKey) {
        if (incomingKeys.has(key)) continue;
        if (member.statusConceptId === CONCEPTS.SEGMENT_MEMBER_REMOVED)
          continue;
        member.statusConceptId = CONCEPTS.SEGMENT_MEMBER_REMOVED;
        touch(member, actor.id);
        removed += 1;
      }

      // `estimated_size` es derivado (REC 3.3): se recalcula, no se recibe.
      const estimatedSize = dto.members.length;
      segment.estimatedSize = String(estimatedSize);
      segment.lastRefreshedAt = new Date();
      touch(segment, actor.id);

      return { segmentId, added, removed, estimatedSize };
    });
  }

  /** UC-50-03: lanzar la campaña sobre un segmento; nace programada. */
  async createCampaign(
    dto: CreateCampaignDto,
    actor: AuthenticatedUser,
  ): Promise<CampaignResponseDto> {
    this.logger.info(
      {
        operation: 'marketing.campaign.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Creating marketing campaign',
    );

    const duplicate = await this.campaignsRepo.findCampaignByCode(
      this.em,
      dto.tenantId,
      dto.code,
    );
    if (duplicate) {
      throw new ConflictException('Ya existe una campaña con ese código', {
        tenantId: dto.tenantId,
        code: dto.code,
      });
    }

    const startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    const endAt = dto.endAt ? new Date(dto.endAt) : undefined;
    if (startAt && endAt && endAt <= startAt) {
      throw new PreconditionFailedException(
        'La campaña debe terminar después de empezar',
        {
          startAt: dto.startAt,
          endAt: dto.endAt,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      if (dto.segmentId) {
        // El segmento se bloquea al vincularlo: no debe desaparecer ni cambiar de
        // estado entre la validación y el alta de la campaña.
        const segment = await this.campaignsRepo.findSegmentForUpdate(
          tx,
          dto.segmentId,
        );
        if (!segment) {
          throw new ResourceNotFoundException('Segmento no encontrado', {
            segmentId: dto.segmentId,
          });
        }
      }

      const campaign = this.campaignsRepo.createCampaign(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        campaignTypeConceptId: CAMPAIGN_TYPE_CONCEPT[dto.campaignType],
        objectiveConceptId: OBJECTIVE_CONCEPT[dto.objective],
        channelConceptId: dto.channel
          ? CHANNEL_CONCEPT[dto.channel]
          : undefined,
        segmentId: dto.segmentId,
        budgetAmount: dto.budgetAmount,
        currencyConceptId: dto.currencyConceptId,
        promotionId: dto.promotionId,
        adCampaignRefId: dto.adCampaignRefId,
        startAt,
        endAt,
        ownerUserId: actor.id,
        statusConceptId: CONCEPTS.CAMPAIGN_SCHEDULED,
        actorUserId: actor.id,
      });

      return {
        id: campaign.id,
        code: dto.code,
        statusConceptId: CONCEPTS.CAMPAIGN_SCHEDULED,
      };
    });
  }

  /**
   * UC-50-04: copiar los miembros activos del segmento a la campaña. Es
   * idempotente: repetir la llamada no duplica audiencia, sólo incorpora lo nuevo.
   */
  async materializeMembers(
    campaignId: string,
    dto: MaterializeMembersDto,
    actor: AuthenticatedUser,
  ): Promise<MaterializeMembersResponseDto> {
    this.logger.info(
      { operation: 'marketing.campaign.materialize', campaignId },
      'Materializing campaign audience',
    );

    return this.em.transactional(async (tx) => {
      const campaign = await this.campaignsRepo.findCampaignForUpdate(
        tx,
        campaignId,
      );
      if (!campaign) {
        throw new ResourceNotFoundException('Campaña no encontrada', {
          campaignId,
        });
      }
      if (!MATERIALIZABLE_CAMPAIGN_STATES.includes(campaign.statusConceptId)) {
        throw new PreconditionFailedException(
          'La campaña no admite materializar audiencia en su estado actual',
          { campaignId, statusConceptId: campaign.statusConceptId },
        );
      }
      if (!campaign.segmentId) {
        throw new PreconditionFailedException(
          'La campaña no tiene segmento del que derivar audiencia',
          {
            campaignId,
          },
        );
      }

      const segmentMembers = await this.campaignsRepo.findActiveSegmentMembers(
        tx,
        campaign.segmentId,
        CONCEPTS.SEGMENT_MEMBER_ACTIVE,
      );
      const alreadyIn = new Set(
        (await this.campaignsRepo.findCampaignMembers(tx, campaignId)).map(
          (m) => `${m.memberTypeConceptId}:${m.memberRefId}`,
        ),
      );
      // Supresión: do-not-contact y preferencias de mensajería llegan resueltas
      // por el orquestador; aquí sólo se respetan.
      const suppressed = new Set(dto.suppressedMemberRefIds ?? []);

      let materialized = 0;
      let skipped = 0;
      for (const member of segmentMembers) {
        const key = `${member.memberTypeConceptId}:${member.memberRefId}`;
        if (alreadyIn.has(key) || suppressed.has(member.memberRefId)) {
          skipped += 1;
          continue;
        }
        this.campaignsRepo.createCampaignMember(tx, {
          campaignId,
          memberTypeConceptId: member.memberTypeConceptId,
          memberRefId: member.memberRefId,
          memberStatusConceptId: CONCEPTS.CAMPAIGN_MEMBER_TARGETED,
          sourceSegmentMemberId: member.id,
          actorUserId: actor.id,
        });
        alreadyIn.add(key);
        materialized += 1;
      }

      campaign.statusConceptId = CONCEPTS.CAMPAIGN_RUNNING;
      touch(campaign, actor.id);

      return {
        campaignId,
        materialized,
        skipped,
        statusConceptId: CONCEPTS.CAMPAIGN_RUNNING,
      };
    });
  }

  /**
   * UC-50-05: publicar una versión de plantilla. La versión sale de la anterior
   * (`prev + 1`) y ésta queda archivada en la misma transacción, de modo que
   * nunca hay dos versiones publicadas del mismo código.
   */
  async publishTemplateVersion(
    code: string,
    dto: PublishTemplateVersionDto,
    actor: AuthenticatedUser,
  ): Promise<TemplateVersionResponseDto> {
    this.logger.info(
      { operation: 'marketing.template.publish', tenantId: dto.tenantId, code },
      'Publishing content template version',
    );

    return this.em.transactional(async (tx) => {
      const previous =
        await this.campaignsRepo.findLatestTemplateVersionForUpdate(
          tx,
          dto.tenantId,
          code,
        );

      let archivedVersionId: string | undefined;
      if (
        previous &&
        previous.statusConceptId === CONCEPTS.CONTENT_TEMPLATE_PUBLISHED
      ) {
        previous.statusConceptId = CONCEPTS.CONTENT_TEMPLATE_ARCHIVED;
        touch(previous, actor.id);
        archivedVersionId = previous.id;
      }

      const version = (previous?.version ?? 0) + 1;
      const template = this.campaignsRepo.createContentTemplate(tx, {
        tenantId: dto.tenantId,
        code,
        name: dto.name,
        channelConceptId: CHANNEL_CONCEPT[dto.channel],
        languageConceptId: dto.languageConceptId,
        subject: dto.subject,
        bodyTemplate: dto.bodyTemplate,
        variablesJson: dto.variablesJson,
        messagingTemplateId: dto.messagingTemplateId,
        version,
        statusConceptId: CONCEPTS.CONTENT_TEMPLATE_PUBLISHED,
        actorUserId: actor.id,
      });

      return { id: template.id, code, version, archivedVersionId };
    });
  }
}
