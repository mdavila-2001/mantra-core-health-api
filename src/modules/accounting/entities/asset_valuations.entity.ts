import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'asset_valuations' })
export class AssetValuations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'asset_id', type: 'uuid' }) // FK → accounting.assets
  assetId!: string;

  @Property({ fieldName: 'asset_component_id', type: 'uuid', nullable: true }) // FK → accounting.asset_components
  assetComponentId?: string;

  @Property({ fieldName: 'depreciation_area_id', type: 'uuid' }) // FK → accounting.depreciation_areas
  depreciationAreaId!: string;

  @Property({
    fieldName: 'depreciation_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  depreciationMethodConceptId?: string;

  @Property({
    fieldName: 'useful_life_months',
    columnType: 'int',
    nullable: true,
  })
  usefulLifeMonths?: number;

  @Property({
    fieldName: 'salvage_value',
    columnType: 'numeric',
    nullable: true,
  })
  salvageValue?: string;

  @Property({
    fieldName: 'acquisition_value',
    columnType: 'numeric',
    nullable: true,
  })
  acquisitionValue?: string;

  @Property({
    fieldName: 'accumulated_depreciation',
    columnType: 'numeric',
    nullable: true,
  })
  accumulatedDepreciation?: string;

  @Property({ fieldName: 'book_value', columnType: 'numeric', nullable: true })
  bookValue?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
