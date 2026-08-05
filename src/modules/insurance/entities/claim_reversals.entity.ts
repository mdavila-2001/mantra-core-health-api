import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `claim_reversals`.
 */
@Entity({ schema: 'insurance', tableName: 'claim_reversals' })
export class ClaimReversals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance claim.
   */
  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  /**
   * Identificador asociado a reversed adjudication version.
   */
  @Property({ fieldName: 'reversed_adjudication_version_id', type: 'uuid' }) // FK → insurance.claim_adjudication_versions
  reversedAdjudicationVersionId!: string;

  /**
   * Identificador asociado a reversal reason concept.
   */
  @Property({ fieldName: 'reversal_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reversalReasonConceptId!: string;

  /**
   * Valor de reversal amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'reversal_amount',
    columnType: 'numeric',
    nullable: true,
  })
  reversalAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a replacement claim.
   */
  @Property({ fieldName: 'replacement_claim_id', type: 'uuid', nullable: true }) // FK → insurance.insurance_claims
  replacementClaimId?: string;

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
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

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
