import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'assets' })
export class Assets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'asset_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assetTypeConceptId?: string;

  @Property({ fieldName: 'account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  accountId?: string;

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
    fieldName: 'accumulated_depreciation',
    columnType: 'numeric',
    nullable: true,
  })
  accumulatedDepreciation?: string;

  @Property({ fieldName: 'book_value', columnType: 'numeric', nullable: true })
  bookValue?: string;

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
