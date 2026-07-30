import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `runbook_executions`.
 */
@Entity({ schema: 'platform_ops', tableName: 'runbook_executions' })
export class RunbookExecutions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a runbook version.
   */
  @Property({ fieldName: 'runbook_version_id', type: 'uuid' }) // FK → platform_ops.runbook_versions
  runbookVersionId!: string;

  /**
   * Identificador asociado a health incident.
   */
  @Property({ fieldName: 'health_incident_id', type: 'uuid', nullable: true }) // FK → platform_ops.health_incidents
  healthIncidentId?: string;

  /**
   * Identificador asociado a change request.
   */
  @Property({ fieldName: 'change_request_id', type: 'uuid', nullable: true }) // FK → platform_ops.change_requests
  changeRequestId?: string;

  /**
   * Identificador asociado a execution mode concept.
   */
  @Property({ fieldName: 'execution_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  executionModeConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Identificador asociado a initiated by user.
   */
  @Property({ fieldName: 'initiated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  initiatedByUserId?: string;

  /**
   * Valor de execution log uri mantenido por la instancia.
   */
  @Property({
    fieldName: 'execution_log_uri',
    columnType: 'varchar',
    nullable: true,
  })
  executionLogUri?: string;

  /**
   * Valor de output json mantenido por la instancia.
   */
  @Property({
    fieldName: 'output_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  outputJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
