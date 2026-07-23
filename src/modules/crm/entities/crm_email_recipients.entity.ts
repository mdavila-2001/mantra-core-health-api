import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_email_recipients' })
export class CrmEmailRecipients {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_email_message_id', type: 'uuid' }) // FK → crm.crm_email_messages
  crmEmailMessageId!: string;

  @Property({ fieldName: 'recipient_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recipientTypeConceptId!: string;

  @Property({ fieldName: 'contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  contactId?: string;

  @Property({ fieldName: 'lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  leadId?: string;

  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  @Property({
    fieldName: 'email_address',
    columnType: 'varchar',
    nullable: true,
  })
  emailAddress?: string;

  @Property({
    fieldName: 'delivery_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  deliveryStatusConceptId?: string;

  @Property({
    fieldName: 'opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  openedAt?: Date;

  @Property({
    fieldName: 'clicked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  clickedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
