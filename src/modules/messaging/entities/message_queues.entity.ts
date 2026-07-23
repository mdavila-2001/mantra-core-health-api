import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'message_queues' })
export class MessageQueues {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'default_priority',
    columnType: 'int',
    nullable: true,
  })
  defaultPriority?: number;

  @Property({
    fieldName: 'default_max_attempts',
    columnType: 'int',
    nullable: true,
  })
  defaultMaxAttempts?: number;

  @Property({
    fieldName: 'visibility_timeout_s',
    columnType: 'int',
    nullable: true,
  })
  visibilityTimeoutS?: number;

  @Property({ fieldName: 'dead_letter_queue_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  deadLetterQueueId?: string;

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
