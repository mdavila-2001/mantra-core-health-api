import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integrations', tableName: 'outbound_messages' })
export class OutboundMessages {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'connection_id', type: 'uuid' }) // FK → integrations.provider_connections
  connectionId!: string;

  @Property({ fieldName: 'endpoint_id', type: 'uuid', nullable: true }) // FK → integrations.integration_endpoints
  endpointId?: string;

  @Property({ fieldName: 'correlation_id', columnType: 'varchar' })
  correlationId!: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({
    fieldName: 'request_payload_json',
    type: 'json',
    columnType: 'jsonb',
  })
  requestPayloadJson!: unknown;

  @Property({
    fieldName: 'headers_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  headersJson?: unknown;

  @Property({ fieldName: 'payload_version', columnType: 'int' })
  payloadVersion!: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'scheduled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledAt?: Date;

  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Property({
    fieldName: 'source_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResourceType?: string;

  @Property({ fieldName: 'source_resource_id', type: 'uuid', nullable: true })
  sourceResourceId?: string;

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
