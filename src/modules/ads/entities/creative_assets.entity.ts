import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'creative_assets' })
export class CreativeAssets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_creative_id', type: 'uuid' }) // FK → ads.ad_creatives
  adCreativeId!: string;

  @Property({ fieldName: 'asset_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assetTypeConceptId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({
    fieldName: 'external_asset_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalAssetRef?: string;

  @Property({ columnType: 'varchar', nullable: true })
  hash?: string;

  @Property({ columnType: 'int', nullable: true })
  width?: number;

  @Property({ columnType: 'int', nullable: true })
  height?: number;

  @Property({ fieldName: 'duration_s', columnType: 'int', nullable: true })
  durationS?: number;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
