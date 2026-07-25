import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'dynamic_ad_templates' })
export class DynamicAdTemplates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'product_set_id', type: 'uuid' }) // FK → ads.product_sets
  productSetId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'format_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  formatConceptId!: string;

  @Property({
    fieldName: 'title_template',
    columnType: 'varchar',
    nullable: true,
  })
  titleTemplate?: string;

  @Property({
    fieldName: 'description_template',
    columnType: 'text',
    nullable: true,
  })
  descriptionTemplate?: string;

  @Property({
    fieldName: 'call_to_action_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  callToActionConceptId?: string;

  @Property({ fieldName: 'creative_id', type: 'uuid', nullable: true }) // FK → ads.ad_creatives
  creativeId?: string;

  @Property({
    fieldName: 'template_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  templateJson?: unknown;

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
}
