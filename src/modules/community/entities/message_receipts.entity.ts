import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `message_receipts`.
 */
@Entity({ schema: 'community', tableName: 'message_receipts' })
export class MessageReceipts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a direct message.
   */
  @Property({ fieldName: 'direct_message_id', type: 'uuid' }) // FK → community.direct_messages
  directMessageId!: string;

  /**
   * Identificador asociado a recipient profile.
   */
  @Property({ fieldName: 'recipient_profile_id', type: 'uuid' }) // FK → community.public_profiles
  recipientProfileId!: string;

  /**
   * Identificador asociado a receipt type concept.
   */
  @Property({ fieldName: 'receipt_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  receiptTypeConceptId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
