import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_email_messages`.
 */
@Entity({ schema: 'crm', tableName: 'crm_email_messages' })
export class CrmEmailMessages {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm activity.
   */
  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  /**
   * Valor de thread reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'thread_reference',
    columnType: 'varchar',
    nullable: true,
  })
  threadReference?: string;

  /**
   * Identificador asociado a internet message.
   */
  @Property({
    fieldName: 'internet_message_id',
    columnType: 'varchar',
    nullable: true,
  })
  internetMessageId?: string;

  /**
   * Valor de from address mantenido por la instancia.
   */
  @Property({
    fieldName: 'from_address',
    columnType: 'varchar',
    nullable: true,
  })
  fromAddress?: string;

  /**
   * Valor de subject mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  subject?: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @Property({ fieldName: 'body_text', columnType: 'text', nullable: true })
  bodyText?: string;

  /**
   * Identificador asociado a body html file.
   */
  @Property({ fieldName: 'body_html_file_id', type: 'uuid', nullable: true }) // FK → common.files
  bodyHtmlFileId?: string;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

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
   * Valor de is inbound mantenido por la instancia.
   */
  @Property({ fieldName: 'is_inbound', type: 'boolean', nullable: true })
  isInbound?: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
