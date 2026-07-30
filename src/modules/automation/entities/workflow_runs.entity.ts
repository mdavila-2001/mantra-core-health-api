import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `workflow_runs`.
 */
@Entity({ schema: 'automation', tableName: 'workflow_runs' })
export class WorkflowRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a workflow.
   */
  @Property({ fieldName: 'workflow_id', type: 'uuid' }) // FK → automation.workflows
  workflowId!: string;

  /**
   * Identificador asociado a trigger.
   */
  @Property({ fieldName: 'trigger_id', type: 'uuid', nullable: true }) // FK → automation.automation_triggers
  triggerId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de run number mantenido por la instancia.
   */
  @Property({ fieldName: 'run_number', columnType: 'varchar' })
  runNumber!: string;

  /**
   * Identificador asociado a trigger source concept.
   */
  @Property({ fieldName: 'trigger_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerSourceConceptId!: string;

  /**
   * Valor de input json mantenido por la instancia.
   */
  @Property({
    fieldName: 'input_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  inputJson?: unknown;

  /**
   * Valor de context ref type mantenido por la instancia.
   */
  @Property({
    fieldName: 'context_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  contextRefType?: string;

  /**
   * Identificador asociado a context ref.
   */
  @Property({ fieldName: 'context_ref_id', type: 'uuid', nullable: true })
  contextRefId?: string;

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
   * Valor de total cost amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalCostAmount?: string;

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
