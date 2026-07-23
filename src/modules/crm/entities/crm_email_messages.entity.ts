import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_email_messages' })
export class CrmEmailMessages {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  @Property({
    fieldName: 'thread_reference',
    columnType: 'varchar',
    nullable: true,
  })
  threadReference?: string;

  @Property({
    fieldName: 'internet_message_id',
    columnType: 'varchar',
    nullable: true,
  })
  internetMessageId?: string;

  @Property({
    fieldName: 'from_address',
    columnType: 'varchar',
    nullable: true,
  })
  fromAddress?: string;

  @Property({ columnType: 'varchar', nullable: true })
  subject?: string;

  @Property({ fieldName: 'body_text', columnType: 'text', nullable: true })
  bodyText?: string;

  @Property({ fieldName: 'body_html_file_id', type: 'uuid', nullable: true }) // FK → common.files
  bodyHtmlFileId?: string;

  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  @Property({
    fieldName: 'delivery_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  deliveryStatusConceptId?: string;

  @Property({ fieldName: 'is_inbound', type: 'boolean', nullable: true })
  isInbound?: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
