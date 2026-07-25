import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'custom_audiences' })
export class CustomAudiences {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'audience_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  audienceTypeConceptId!: string;

  @Property({ fieldName: 'subtype_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  subtypeConceptId?: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  @Property({
    fieldName: 'rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  ruleJson?: unknown;

  @Property({
    fieldName: 'lookalike_source_audience_id',
    type: 'uuid',
    nullable: true,
  }) // FK → ads.custom_audiences
  lookalikeSourceAudienceId?: string;

  @Property({
    fieldName: 'lookalike_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  lookalikeSpecJson?: unknown;

  @Property({ fieldName: 'approximate_count', type: 'bigint', nullable: true })
  approximateCount?: string;

  @Property({ fieldName: 'data_source_pixel_id', type: 'uuid', nullable: true }) // FK → ads.tracking_pixels
  dataSourcePixelId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'external_audience_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalAudienceRef?: string;

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
