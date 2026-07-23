import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'infrastructure_items' })
export class InfrastructureItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  categoryConceptId!: string;

  @Property({ fieldName: 'asset_id', type: 'uuid', nullable: true }) // FK → accounting.assets
  assetId?: string;

  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  @Property({
    fieldName: 'location_text',
    columnType: 'varchar',
    nullable: true,
  })
  locationText?: string;

  @Property({
    fieldName: 'acquisition_cost',
    columnType: 'numeric',
    nullable: true,
  })
  acquisitionCost?: string;

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
