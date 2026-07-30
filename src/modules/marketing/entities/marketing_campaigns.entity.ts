import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `marketing_campaigns`.
 */
@Entity({ schema: 'marketing', tableName: 'marketing_campaigns' })
export class MarketingCampaigns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a campaign type concept.
   */
  @Property({ fieldName: 'campaign_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  campaignTypeConceptId!: string;

  /**
   * Identificador asociado a objective concept.
   */
  @Property({ fieldName: 'objective_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectiveConceptId!: string;

  /**
   * Identificador asociado a channel concept.
   */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  channelConceptId?: string;

  /**
   * Identificador asociado a segment.
   */
  @Property({ fieldName: 'segment_id', type: 'uuid', nullable: true }) // FK → marketing.segments
  segmentId?: string;

  /**
   * Valor de budget amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'budget_amount',
    columnType: 'numeric',
    nullable: true,
  })
  budgetAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a ad campaign ref.
   */
  @Property({ fieldName: 'ad_campaign_ref_id', type: 'uuid', nullable: true })
  adCampaignRefId?: string;

  /**
   * Identificador asociado a promotion.
   */
  @Property({ fieldName: 'promotion_id', type: 'uuid', nullable: true }) // FK → promotions.promotions
  promotionId?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /**
   * Identificador asociado a governance scope concept.
   */
  @Property({
    fieldName: 'governance_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  governanceScopeConceptId?: string;

  /**
   * Valor de requires explicit publish mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_explicit_publish',
    type: 'boolean',
    nullable: true,
  })
  requiresExplicitPublish?: boolean;

  /**
   * Valor de published version mantenido por la instancia.
   */
  @Property({
    fieldName: 'published_version',
    columnType: 'int',
    nullable: true,
  })
  publishedVersion?: number;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  /**
   * Identificador asociado a published by user.
   */
  @Property({ fieldName: 'published_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  publishedByUserId?: string;

  /**
   * Valor de approved content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  approvedContentHash?: string;

  /**
   * Valor de approved audience hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'approved_audience_hash',
    columnType: 'varchar',
    nullable: true,
  })
  approvedAudienceHash?: string;

  /**
   * Valor de cancellation reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancellation_reason',
    columnType: 'varchar',
    nullable: true,
  })
  cancellationReason?: string;

  /**
   * Valor de cancelled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;

  /**
   * Identificador asociado a cancelled by user.
   */
  @Property({ fieldName: 'cancelled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  cancelledByUserId?: string;
}
