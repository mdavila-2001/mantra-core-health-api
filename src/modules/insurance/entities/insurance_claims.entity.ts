import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'insurance_claims' })
export class InsuranceClaims {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers
  insuranceCarrierId!: string;

  @Property({ fieldName: 'patient_coverage_id', type: 'uuid' }) // FK → insurance.patient_coverages
  patientCoverageId!: string;

  @Property({ fieldName: 'billing_provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  billingProviderTypeConceptId!: string;

  @Property({ fieldName: 'billing_provider_entity_id', type: 'uuid' })
  billingProviderEntityId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({
    fieldName: 'prior_authorization_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.prior_authorization_requests
  priorAuthorizationRequestId?: string;

  @Property({ fieldName: 'claim_identifier', columnType: 'varchar' })
  claimIdentifier!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'submitted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  submittedAt?: Date;

  @Property({
    fieldName: 'total_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

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
