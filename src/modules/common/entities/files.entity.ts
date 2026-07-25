import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'common', tableName: 'files' })
export class Files {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  categoryConceptId!: string;

  @Property({
    fieldName: 'original_name',
    columnType: 'varchar',
    nullable: true,
  })
  originalName?: string;

  @Property({ fieldName: 'sensitivity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sensitivityConceptId!: string;

  @Property({ fieldName: 'lifecycle_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  lifecycleStatusConceptId!: string;

  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK → common.file_versions
  currentVersionId?: string;

  @Property({
    fieldName: 'retention_class_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  retentionClassConceptId?: string;

  @Property({
    fieldName: 'legal_hold_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  legalHoldUntil?: Date;

  @Property({
    fieldName: 'deleted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

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
