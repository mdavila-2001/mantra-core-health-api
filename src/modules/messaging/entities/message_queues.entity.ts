import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `message_queues`.
 */
@Entity({ schema: 'messaging', tableName: 'message_queues' })
export class MessageQueues {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de default priority mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_priority',
    columnType: 'int',
    nullable: true,
  })
  defaultPriority?: number;

  /**
   * Valor de default max attempts mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_max_attempts',
    columnType: 'int',
    nullable: true,
  })
  defaultMaxAttempts?: number;

  /**
   * Valor de visibility timeout s mantenido por la instancia.
   */
  @Property({
    fieldName: 'visibility_timeout_s',
    columnType: 'int',
    nullable: true,
  })
  visibilityTimeoutS?: number;

  /**
   * Identificador asociado a dead letter queue.
   */
  @Property({ fieldName: 'dead_letter_queue_id', type: 'uuid', nullable: true }) // FK → messaging.message_queues
  deadLetterQueueId?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
