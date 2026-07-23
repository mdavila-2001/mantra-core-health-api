import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'read_model_definitions' })
export class ReadModelDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  @Property({ fieldName: 'object_name', columnType: 'varchar' })
  objectName!: string;

  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  @Property({
    fieldName: 'owning_module',
    columnType: 'varchar',
    nullable: true,
  })
  owningModule?: string;

  @Property({ fieldName: 'purpose_text', columnType: 'text', nullable: true })
  purposeText?: string;

  @Property({
    fieldName: 'refresh_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  refreshModeConceptId?: string;

  @Property({
    fieldName: 'maximum_staleness_seconds',
    columnType: 'int',
    nullable: true,
  })
  maximumStalenessSeconds?: number;

  @Property({
    fieldName: 'default_page_size',
    columnType: 'int',
    nullable: true,
  })
  defaultPageSize?: number;

  @Property({
    fieldName: 'maximum_page_size',
    columnType: 'int',
    nullable: true,
  })
  maximumPageSize?: number;

  @Property({
    fieldName: 'stable_cursor_columns_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  stableCursorColumnsJson?: unknown;

  @Property({ fieldName: 'contains_pii', type: 'boolean', nullable: true })
  containsPii?: boolean;

  @Property({ fieldName: 'contains_phi', type: 'boolean', nullable: true })
  containsPhi?: boolean;

  @Property({
    fieldName: 'security_barrier_required',
    type: 'boolean',
    nullable: true,
  })
  securityBarrierRequired?: boolean;

  @Property({
    fieldName: 'row_level_security_required',
    type: 'boolean',
    nullable: true,
  })
  rowLevelSecurityRequired?: boolean;

  @Property({
    fieldName: 'definition_hash',
    columnType: 'varchar',
    nullable: true,
  })
  definitionHash?: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

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
