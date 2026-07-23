import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integrations', tableName: 'message_responses' })
export class MessageResponses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'outbound_message_id', type: 'uuid' }) // FK → integrations.outbound_messages
  outboundMessageId!: string;

  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  @Property({
    fieldName: 'response_payload_json',
    type: 'json',
    columnType: 'jsonb',
  })
  responsePayloadJson!: unknown;

  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  @Property({ fieldName: 'is_success', type: 'boolean', nullable: true })
  isSuccess?: boolean;

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
