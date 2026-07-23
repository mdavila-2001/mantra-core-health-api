import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'claim_line_adjudications' })
export class ClaimLineAdjudications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'claim_adjudication_version_id', type: 'uuid' }) // FK → insurance.claim_adjudication_versions
  claimAdjudicationVersionId!: string;

  @Property({ fieldName: 'insurance_claim_line_id', type: 'uuid' }) // FK → insurance.insurance_claim_lines
  insuranceClaimLineId!: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({
    fieldName: 'approved_amount',
    columnType: 'numeric',
    nullable: true,
  })
  approvedAmount?: string;

  @Property({
    fieldName: 'patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientAmount?: string;

  @Property({
    fieldName: 'denied_amount',
    columnType: 'numeric',
    nullable: true,
  })
  deniedAmount?: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
