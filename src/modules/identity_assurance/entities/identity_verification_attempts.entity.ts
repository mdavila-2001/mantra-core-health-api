import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_verification_attempts`.
 */
@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_verification_attempts',
})
export class IdentityVerificationAttempts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a identity verification case.
   */
  @Property({ fieldName: 'identity_verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  identityVerificationCaseId!: string;

  /**
   * Identificador asociado a identity authority endpoint.
   */
  @Property({ fieldName: 'identity_authority_endpoint_id', type: 'uuid' }) // FK → identity_assurance.identity_authority_endpoints
  identityAuthorityEndpointId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Identificador asociado a request message.
   */
  @Property({ fieldName: 'request_message_id', type: 'uuid', nullable: true }) // FK → integrations.outbound_messages
  requestMessageId?: string;

  /**
   * Identificador asociado a response message.
   */
  @Property({ fieldName: 'response_message_id', type: 'uuid', nullable: true }) // FK → integrations.inbound_messages
  responseMessageId?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Valor de technical error code mantenido por la instancia.
   */
  @Property({
    fieldName: 'technical_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  technicalErrorCode?: string;

  /**
   * Valor de retry eligible mantenido por la instancia.
   */
  @Property({ fieldName: 'retry_eligible', type: 'boolean', nullable: true })
  retryEligible?: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
