import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'collection_ads' })
export class CollectionAds {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'layout_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  layoutConceptId!: string;

  @Property({ fieldName: 'hero_creative_id', type: 'uuid', nullable: true }) // FK → ads.ad_creatives
  heroCreativeId?: string;

  @Property({ fieldName: 'product_set_id', type: 'uuid', nullable: true }) // FK → ads.product_sets
  productSetId?: string;

  @Property({
    fieldName: 'instant_experience_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  instantExperienceJson?: unknown;

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
