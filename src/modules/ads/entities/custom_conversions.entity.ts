import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'custom_conversions' })
export class CustomConversions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'pixel_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  pixelId?: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'conversion_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  conversionCategoryConceptId!: string;

  @Property({
    fieldName: 'rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  ruleJson?: unknown;

  @Property({
    fieldName: 'default_value',
    columnType: 'numeric',
    nullable: true,
  })
  defaultValue?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
