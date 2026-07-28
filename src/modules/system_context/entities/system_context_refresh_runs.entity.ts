import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `system_context_refresh_runs`.
 */
@Entity({ schema: 'system_context', tableName: 'system_context_refresh_runs' })
export class SystemContextRefreshRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a system context.
   */
  @Property({ fieldName: 'system_context_id', type: 'uuid' }) // FK → system_context.system_contexts
  systemContextId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Identificador asociado a trigger concept.
   */
  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

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
   * Valor de input count mantenido por la instancia.
   */
  @Property({ fieldName: 'input_count', columnType: 'int', nullable: true })
  inputCount?: number;

  /**
   * Valor de output content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'output_content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  outputContentHash?: string;

  /**
   * Valor de error summary mantenido por la instancia.
   */
  @Property({ fieldName: 'error_summary', columnType: 'text', nullable: true })
  errorSummary?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
