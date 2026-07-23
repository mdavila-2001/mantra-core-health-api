import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'claim_reversals' })
export class ClaimReversals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  @Property({ fieldName: 'reversed_adjudication_version_id', type: 'uuid' }) // FK (destino no resuelto)
  reversedAdjudicationVersionId!: string;

  @Property({ fieldName: 'reversal_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reversalReasonConceptId!: string;

  @Property({
    fieldName: 'reversal_amount',
    columnType: 'numeric',
    nullable: true,
  })
  reversalAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'replacement_claim_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  replacementClaimId?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
