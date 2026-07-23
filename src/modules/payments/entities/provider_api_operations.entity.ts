import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'provider_api_operations' })
export class ProviderApiOperations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  @Property({ fieldName: 'operation_code', columnType: 'varchar' })
  operationCode!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'http_method', columnType: 'varchar' })
  httpMethod!: string;

  @Property({ fieldName: 'endpoint_template', columnType: 'varchar' })
  endpointTemplate!: string;

  @Property({ fieldName: 'timeout_ms', columnType: 'int', nullable: true })
  timeoutMs?: number;

  @Property({
    fieldName: 'retry_policy_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  retryPolicyJson?: unknown;

  @Property({
    fieldName: 'request_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requestSchemaJson?: unknown;

  @Property({
    fieldName: 'response_schema_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responseSchemaJson?: unknown;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
