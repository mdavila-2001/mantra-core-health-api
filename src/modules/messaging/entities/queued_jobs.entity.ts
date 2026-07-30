import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `queued_jobs`.
 */
@Entity({ schema: 'messaging', tableName: 'queued_jobs' })
export class QueuedJobs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a queue.
   */
  @Property({ fieldName: 'queue_id', type: 'uuid' }) // FK → messaging.message_queues
  queueId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de job type mantenido por la instancia.
   */
  @Property({ fieldName: 'job_type', columnType: 'varchar' })
  jobType!: string;

  /**
   * Valor de dedupe key mantenido por la instancia.
   */
  @Property({ fieldName: 'dedupe_key', columnType: 'varchar', nullable: true })
  dedupeKey?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  priority!: number;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de available at mantenido por la instancia.
   */
  @Property({
    fieldName: 'available_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  availableAt?: Date;

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
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de attempts mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  attempts!: number;

  /**
   * Valor de max attempts mantenido por la instancia.
   */
  @Property({ fieldName: 'max_attempts', columnType: 'int' })
  maxAttempts!: number;

  /**
   * Valor de locked by mantenido por la instancia.
   */
  @Property({ fieldName: 'locked_by', columnType: 'varchar', nullable: true })
  lockedBy?: string;

  /**
   * Valor de lock expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'lock_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockExpiresAt?: Date;

  /**
   * Valor de last error text mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_error_text',
    columnType: 'text',
    nullable: true,
  })
  lastErrorText?: string;

  /**
   * Valor de result json mantenido por la instancia.
   */
  @Property({
    fieldName: 'result_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  resultJson?: unknown;

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
