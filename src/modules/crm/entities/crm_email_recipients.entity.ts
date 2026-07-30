import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_email_recipients`.
 */
@Entity({ schema: 'crm', tableName: 'crm_email_recipients' })
export class CrmEmailRecipients {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm email message.
   */
  @Property({ fieldName: 'crm_email_message_id', type: 'uuid' }) // FK → crm.crm_email_messages
  crmEmailMessageId!: string;

  /**
   * Identificador asociado a recipient type concept.
   */
  @Property({ fieldName: 'recipient_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recipientTypeConceptId!: string;

  /**
   * Identificador asociado a contact.
   */
  @Property({ fieldName: 'contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  contactId?: string;

  /**
   * Identificador asociado a lead.
   */
  @Property({ fieldName: 'lead_id', type: 'uuid', nullable: true }) // FK → crm.leads
  leadId?: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  /**
   * Valor de email address mantenido por la instancia.
   */
  @Property({
    fieldName: 'email_address',
    columnType: 'varchar',
    nullable: true,
  })
  emailAddress?: string;

  /**
   * Identificador asociado a delivery status concept.
   */
  @Property({
    fieldName: 'delivery_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  deliveryStatusConceptId?: string;

  /**
   * Valor de opened at mantenido por la instancia.
   */
  @Property({
    fieldName: 'opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  openedAt?: Date;

  /**
   * Valor de clicked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'clicked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  clickedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
