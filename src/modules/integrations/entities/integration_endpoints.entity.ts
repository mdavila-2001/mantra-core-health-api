import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integrations', tableName: 'integration_endpoints' })
export class IntegrationEndpoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → integrations.external_providers
  providerId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  operation!: string;

  @Property({
    fieldName: 'http_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  httpMethodConceptId?: string;

  @Property({ columnType: 'text', nullable: true })
  path?: string;

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

  @Property({ columnType: 'varchar' })
  version!: string;

  @Property({ fieldName: 'timeout_ms', columnType: 'int', nullable: true })
  timeoutMs?: number;

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
