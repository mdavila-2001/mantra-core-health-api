import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'callback_verification_runs' })
export class CallbackVerificationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_callback_event_id', type: 'uuid' }) // FK → payments.provider_callback_events
  providerCallbackEventId!: string;

  @Property({ fieldName: 'verification_method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationMethodConceptId!: string;

  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({ fieldName: 'signature_present', type: 'boolean', nullable: true })
  signaturePresent?: boolean;

  @Property({
    fieldName: 'timestamp_within_window',
    type: 'boolean',
    nullable: true,
  })
  timestampWithinWindow?: boolean;

  @Property({
    fieldName: 'source_network_allowed',
    type: 'boolean',
    nullable: true,
  })
  sourceNetworkAllowed?: boolean;

  @Property({
    fieldName: 'status_inquiry_confirmed',
    type: 'boolean',
    nullable: true,
  })
  statusInquiryConfirmed?: boolean;

  @Property({ fieldName: 'failure_reason', columnType: 'text', nullable: true })
  failureReason?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
