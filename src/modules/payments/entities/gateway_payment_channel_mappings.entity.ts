import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `gateway_payment_channel_mappings`.
 */
@Entity({ schema: 'payments', tableName: 'gateway_payment_channel_mappings' })
export class GatewayPaymentChannelMappings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a gateway connection.
   */
  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  /**
   * Identificador asociado a payment channel catalog.
   */
  @Property({ fieldName: 'payment_channel_catalog_id', type: 'uuid' }) // FK → payments.payment_channel_catalog
  paymentChannelCatalogId!: string;

  /**
   * Valor de external channel code mantenido por la instancia.
   */
  @Property({ fieldName: 'external_channel_code', columnType: 'varchar' })
  externalChannelCode!: string;

  /**
   * Valor de configuration json mantenido por la instancia.
   */
  @Property({
    fieldName: 'configuration_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  configurationJson?: unknown;

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
