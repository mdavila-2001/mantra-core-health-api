import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `direct_messages`.
 */
@Entity({ schema: 'community', tableName: 'direct_messages' })
export class DirectMessages {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a conversation.
   */
  @Property({ fieldName: 'conversation_id', type: 'uuid' }) // FK → community.conversations
  conversationId!: string;

  /**
   * Identificador asociado a sender profile.
   */
  @Property({ fieldName: 'sender_profile_id', type: 'uuid' }) // FK → community.public_profiles
  senderProfileId!: string;

  /**
   * Identificador asociado a reply to message.
   */
  @Property({ fieldName: 'reply_to_message_id', type: 'uuid', nullable: true }) // FK → community.direct_messages
  replyToMessageId?: string;

  /**
   * Identificador asociado a content type concept.
   */
  @Property({ fieldName: 'content_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentTypeConceptId!: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @Property({ fieldName: 'body_text', columnType: 'text', nullable: true })
  bodyText?: string;

  /**
   * Identificador asociado a attachment file.
   */
  @Property({ fieldName: 'attachment_file_id', type: 'uuid', nullable: true }) // FK → common.files
  attachmentFileId?: string;

  /**
   * Valor de is edited mantenido por la instancia.
   */
  @Property({ fieldName: 'is_edited', type: 'boolean', nullable: true })
  isEdited?: boolean;

  /**
   * Fecha y hora de la eliminación lógica, si corresponde.
   */
  @Property({
    fieldName: 'deleted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
