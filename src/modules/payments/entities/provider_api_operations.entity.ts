import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_api_operations`.
 */
@Entity({ schema: 'payments', tableName: 'provider_api_operations' })
export class ProviderApiOperations {
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
   * Valor de operation code mantenido por la instancia.
   */
  @Property({ fieldName: 'operation_code', columnType: 'varchar' })
  operationCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @Property({ fieldName: 'http_method', columnType: 'varchar' })
  httpMethod!: string;

  /**
   * Valor de endpoint template mantenido por la instancia.
   */
  @Property({ fieldName: 'endpoint_template', columnType: 'varchar' })
  endpointTemplate!: string;

  /**
   * Valor de timeout ms mantenido por la instancia.
   */
  @Property({ fieldName: 'timeout_ms', columnType: 'int', nullable: true })
  timeoutMs?: number;

  /**
   * Valor de retry policy json mantenido por la instancia.
   */
  @Property({
    fieldName: 'retry_policy_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  retryPolicyJson?: unknown;

  /**
   * Valor de request schema json mantenido por la instancia.
   */
  @Property({
    fieldName: 'request_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requestSchemaJson?: unknown;

  /**
   * Valor de response schema json mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responseSchemaJson?: unknown;

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
