import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `message_responses`.
 */
@Entity({ schema: 'integrations', tableName: 'message_responses' })
export class MessageResponses {
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
   * Valor de http status mantenido por la instancia.
   */
  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  /**
   * Valor de response payload json mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_payload_json',
    type: 'json',
    columnType: 'jsonb',
  })
  responsePayloadJson!: unknown;

  /**
   * Valor de latency ms mantenido por la instancia.
   */
  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  /**
   * Valor de is success mantenido por la instancia.
   */
  @Property({ fieldName: 'is_success', type: 'boolean', nullable: true })
  isSuccess?: boolean;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

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
