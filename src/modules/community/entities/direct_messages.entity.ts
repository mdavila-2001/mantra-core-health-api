import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'direct_messages' })
export class DirectMessages {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'conversation_id', type: 'uuid' }) // FK → community.conversations
  conversationId!: string;

  @Property({ fieldName: 'sender_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  senderProfileId!: string;

  @Property({ fieldName: 'reply_to_message_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  replyToMessageId?: string;

  @Property({ fieldName: 'content_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentTypeConceptId!: string;

  @Property({ fieldName: 'body_text', columnType: 'text', nullable: true })
  bodyText?: string;

  @Property({ fieldName: 'attachment_file_id', type: 'uuid', nullable: true }) // FK → common.files
  attachmentFileId?: string;

  @Property({ fieldName: 'is_edited', type: 'boolean', nullable: true })
  isEdited?: boolean;

  @Property({
    fieldName: 'deleted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

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
