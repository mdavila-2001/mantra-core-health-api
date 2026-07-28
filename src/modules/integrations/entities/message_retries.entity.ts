import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `message_retries`.
 */
@Entity({ schema: 'integrations', tableName: 'message_retries' })
export class MessageRetries {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a outbound message.
   */
  @Property({ fieldName: 'outbound_message_id', type: 'uuid' }) // FK → integrations.outbound_messages
  outboundMessageId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  /**
   * Valor de request snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'request_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requestSnapshotJson?: unknown;

  /**
   * Valor de payload version mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_version', columnType: 'int' })
  payloadVersion!: number;

  /**
   * Valor de attempted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'attempted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  attemptedAt?: Date;

  /**
   * Valor de next retry at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRetryAt?: Date;

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
