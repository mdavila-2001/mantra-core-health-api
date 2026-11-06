import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Maps `community.message_reactions` (patch v4.2.91): one reaction per
 * profile and direct message, like WhatsApp.
 */
@Entity({ schema: 'community', tableName: 'message_reactions' })
export class MessageReactions {
  /** Unique identifier. */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /** Reacted message. */
  @Property({ fieldName: 'direct_message_id', type: 'uuid' }) // FK → community.direct_messages
  directMessageId!: string;

  /** Reacting profile. */
  @Property({ fieldName: 'profile_id', type: 'uuid' }) // FK → community.public_profiles
  profileId!: string;

  /** The emoji, as the client sent it (one grapheme, at most 32 bytes). */
  @Property({ fieldName: 'emoji', type: 'string', length: 32 })
  emoji!: string;

  /** When the reaction was first recorded. */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt: Date = new Date();

  /** When the emoji was last replaced. */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt: Date = new Date();

  /** User who reacted. */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
