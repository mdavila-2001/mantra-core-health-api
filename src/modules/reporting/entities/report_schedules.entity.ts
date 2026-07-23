import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'reporting', tableName: 'report_schedules' })
export class ReportSchedules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'report_definition_id', type: 'uuid' }) // FK → reporting.report_definitions
  reportDefinitionId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'cron_expression', columnType: 'varchar' })
  cronExpression!: string;

  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  @Property({
    fieldName: 'parameters_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  parametersJson?: unknown;

  @Property({ fieldName: 'output_format_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outputFormatConceptId!: string;

  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

  @Property({
    fieldName: 'next_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRunAt?: Date;

  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

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
