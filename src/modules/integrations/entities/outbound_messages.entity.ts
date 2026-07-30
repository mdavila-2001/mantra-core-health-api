import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `outbound_messages`.
 */
@Entity({ schema: 'integrations', tableName: 'outbound_messages' })
export class OutboundMessages {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a connection.
   */
  @Property({ fieldName: 'connection_id', type: 'uuid' }) // FK → integrations.provider_connections
  connectionId!: string;

  /**
   * Identificador asociado a endpoint.
   */
  @Property({ fieldName: 'endpoint_id', type: 'uuid', nullable: true }) // FK → integrations.integration_endpoints
  endpointId?: string;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', columnType: 'varchar' })
  correlationId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /**
   * Valor de request payload json mantenido por la instancia.
   */
  @Property({
    fieldName: 'request_payload_json',
    type: 'json',
    columnType: 'jsonb',
  })
  requestPayloadJson!: unknown;

  /**
   * Valor de headers json mantenido por la instancia.
   */
  @Property({
    fieldName: 'headers_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  headersJson?: unknown;

  /**
   * Valor de payload version mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_version', columnType: 'int' })
  payloadVersion!: number;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'scheduled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledAt?: Date;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  /**
   * Valor de source resource type mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResourceType?: string;

  /**
   * Identificador asociado a source resource.
   */
  @Property({ fieldName: 'source_resource_id', type: 'uuid', nullable: true })
  sourceResourceId?: string;

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
