import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'marketing_campaigns' })
export class MarketingCampaigns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'campaign_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  campaignTypeConceptId!: string;

  @Property({ fieldName: 'objective_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectiveConceptId!: string;

  @Property({ fieldName: 'channel_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  channelConceptId?: string;

  @Property({ fieldName: 'segment_id', type: 'uuid', nullable: true }) // FK → marketing.segments
  segmentId?: string;

  @Property({
    fieldName: 'budget_amount',
    columnType: 'numeric',
    nullable: true,
  })
  budgetAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'ad_campaign_ref_id', type: 'uuid', nullable: true })
  adCampaignRefId?: string;

  @Property({ fieldName: 'promotion_id', type: 'uuid', nullable: true }) // FK → promotions.promotions
  promotionId?: string;

  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  @Property({
    fieldName: 'governance_scope_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  governanceScopeConceptId?: string;

  @Property({
    fieldName: 'requires_explicit_publish',
    type: 'boolean',
    nullable: true,
  })
  requiresExplicitPublish?: boolean;

  @Property({
    fieldName: 'published_version',
    columnType: 'int',
    nullable: true,
  })
  publishedVersion?: number;

  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  @Property({ fieldName: 'published_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  publishedByUserId?: string;

  @Property({
    fieldName: 'approved_content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  approvedContentHash?: string;

  @Property({
    fieldName: 'approved_audience_hash',
    columnType: 'varchar',
    nullable: true,
  })
  approvedAudienceHash?: string;

  @Property({
    fieldName: 'cancellation_reason',
    columnType: 'varchar',
    nullable: true,
  })
  cancellationReason?: string;

  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;

  @Property({ fieldName: 'cancelled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  cancelledByUserId?: string;
}
