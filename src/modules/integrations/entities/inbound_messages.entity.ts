import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inbound_messages`.
 */
@Entity({ schema: 'integrations', tableName: 'inbound_messages' })
export class InboundMessages {
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
  @Property({
    fieldName: 'correlation_id',
    columnType: 'varchar',
    nullable: true,
  })
  correlationId?: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Valor de signature mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  signature?: string;

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
