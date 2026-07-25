import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'message_receipts' })
export class MessageReceipts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'direct_message_id', type: 'uuid' })  // FK → community.direct_messages
  directMessageId!: string;

  @Property({ fieldName: 'recipient_profile_id', type: 'uuid' })  // FK → community.public_profiles
  recipientProfileId!: string;

  @Property({ fieldName: 'receipt_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  receiptTypeConceptId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz', nullable: true })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  recordedByUserId?: string;

}
