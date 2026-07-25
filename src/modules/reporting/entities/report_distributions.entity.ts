import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'reporting', tableName: 'report_distributions' })
export class ReportDistributions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'schedule_id', type: 'uuid', nullable: true }) // FK → reporting.report_schedules
  scheduleId?: string;

  @Property({ fieldName: 'report_execution_id', type: 'uuid', nullable: true }) // FK → reporting.report_executions
  reportExecutionId?: string;

  @Property({ fieldName: 'recipient_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recipientTypeConceptId!: string;

  @Property({ fieldName: 'recipient_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recipientUserId?: string;

  @Property({
    fieldName: 'recipient_address',
    columnType: 'varchar',
    nullable: true,
  })
  recipientAddress?: string;

  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

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
