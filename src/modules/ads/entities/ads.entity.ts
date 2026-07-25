import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ads' })
export class Ads {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_set_id', type: 'uuid' }) // FK → ads.ad_sets
  adSetId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'creative_id', type: 'uuid' }) // FK → ads.ad_creatives
  creativeId!: string;

  @Property({
    fieldName: 'tracking_specs_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  trackingSpecsJson?: unknown;

  @Property({
    fieldName: 'conversion_domain',
    columnType: 'varchar',
    nullable: true,
  })
  conversionDomain?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'effective_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  effectiveStatusConceptId?: string;

  @Property({
    fieldName: 'review_feedback_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  reviewFeedbackJson?: unknown;

  @Property({
    fieldName: 'external_ad_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalAdRef?: string;

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
}
