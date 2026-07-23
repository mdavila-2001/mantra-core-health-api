import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integrations', tableName: 'inbound_messages' })
export class InboundMessages {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'connection_id', type: 'uuid' }) // FK (destino no resuelto)
  connectionId!: string;

  @Property({ fieldName: 'endpoint_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  endpointId?: string;

  @Property({
    fieldName: 'correlation_id',
    columnType: 'varchar',
    nullable: true,
  })
  correlationId?: string;

  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  @Property({ columnType: 'varchar', nullable: true })
  signature?: string;

  @Property({ fieldName: 'payload_version', columnType: 'int' })
  payloadVersion!: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

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
