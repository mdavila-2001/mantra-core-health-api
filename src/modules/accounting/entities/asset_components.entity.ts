import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'asset_components' })
export class AssetComponents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'asset_id', type: 'uuid' }) // FK → accounting.assets
  assetId!: string;

  @Property({ fieldName: 'component_number', columnType: 'varchar' })
  componentNumber!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'asset_class_id', type: 'uuid', nullable: true }) // FK → accounting.asset_classes
  assetClassId?: string;

  @Property({
    fieldName: 'acquisition_date',
    columnType: 'date',
    nullable: true,
  })
  acquisitionDate?: Date;

  @Property({
    fieldName: 'acquisition_cost',
    columnType: 'numeric',
    nullable: true,
  })
  acquisitionCost?: string;

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
