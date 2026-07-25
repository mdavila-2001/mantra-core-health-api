import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_verification_attempts',
})
export class IdentityVerificationAttempts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'identity_verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  identityVerificationCaseId!: string;

  @Property({ fieldName: 'identity_authority_endpoint_id', type: 'uuid' }) // FK → identity_assurance.identity_authority_endpoints
  identityAuthorityEndpointId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ fieldName: 'request_message_id', type: 'uuid', nullable: true }) // FK → integrations.outbound_messages
  requestMessageId?: string;

  @Property({ fieldName: 'response_message_id', type: 'uuid', nullable: true }) // FK → integrations.inbound_messages
  responseMessageId?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({
    fieldName: 'technical_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  technicalErrorCode?: string;

  @Property({ fieldName: 'retry_eligible', type: 'boolean', nullable: true })
  retryEligible?: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
