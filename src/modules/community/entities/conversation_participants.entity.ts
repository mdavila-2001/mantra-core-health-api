import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'conversation_participants' })
export class ConversationParticipants {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'conversation_id', type: 'uuid' }) // FK → community.conversations
  conversationId!: string;

  @Property({ fieldName: 'participant_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  participantProfileId!: string;

  @Property({ fieldName: 'role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  roleConceptId!: string;

  @Property({
    fieldName: 'joined_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  joinedAt?: Date;

  @Property({ fieldName: 'last_read_message_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  lastReadMessageId?: string;

  @Property({
    fieldName: 'muted_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  mutedUntil?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
