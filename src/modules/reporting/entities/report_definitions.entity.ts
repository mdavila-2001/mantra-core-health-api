import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'reporting', tableName: 'report_definitions' })
export class ReportDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  @Property({ fieldName: 'data_source_id', type: 'uuid' }) // FK → reporting.report_data_sources
  dataSourceId!: string;

  @Property({
    fieldName: 'query_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  querySpecJson?: unknown;

  @Property({
    fieldName: 'default_output_format_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultOutputFormatConceptId?: string;

  @Property({
    fieldName: 'required_permission_id',
    type: 'uuid',
    nullable: true,
  }) // FK → authz.permissions
  requiredPermissionId?: string;

  @Property({ fieldName: 'is_public', type: 'boolean', nullable: true })
  isPublic?: boolean;

  @Property({ fieldName: 'current_version', columnType: 'int' })
  currentVersion!: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
