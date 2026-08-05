import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `report_executions`.
 */
@Entity({ schema: 'reporting', tableName: 'report_executions' })
export class ReportExecutions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a report definition.
   */
  @Property({ fieldName: 'report_definition_id', type: 'uuid' }) // FK → reporting.report_definitions
  reportDefinitionId!: string;

  /**
   * Identificador asociado a report version.
   */
  @Property({ fieldName: 'report_version_id', type: 'uuid', nullable: true }) // FK → reporting.report_versions
  reportVersionId?: string;

  /**
   * Identificador asociado a schedule.
   */
  @Property({ fieldName: 'schedule_id', type: 'uuid', nullable: true }) // FK → reporting.report_schedules
  scheduleId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a trigger concept.
   */
  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerConceptId!: string;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  requestedByUserId?: string;

  /**
   * Valor de parameters json mantenido por la instancia.
   */
  @Property({
    fieldName: 'parameters_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  parametersJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Valor de row count mantenido por la instancia.
   */
  @Property({ fieldName: 'row_count', type: 'bigint', nullable: true })
  rowCount?: string;

  /**
   * Identificador asociado a output format concept.
   */
  @Property({
    fieldName: 'output_format_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  outputFormatConceptId?: string;

  /**
   * Identificador asociado a output file.
   */
  @Property({ fieldName: 'output_file_id', type: 'uuid', nullable: true }) // FK → common.files
  outputFileId?: string;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
