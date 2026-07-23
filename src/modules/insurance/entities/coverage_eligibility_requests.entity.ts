import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'coverage_eligibility_requests' })
export class CoverageEligibilityRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_coverage_id', type: 'uuid' }) // FK → insurance.patient_coverages
  patientCoverageId!: string;

  @Property({ fieldName: 'requesting_provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  requestingProviderTypeConceptId!: string;

  @Property({
    fieldName: 'requesting_provider_entity_id',
    type: 'uuid',
    nullable: true,
  })
  requestingProviderEntityId?: string;

  @Property({ fieldName: 'service_date', columnType: 'date', nullable: true })
  serviceDate?: Date;

  @Property({ fieldName: 'purpose_value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  purposeValueSetId?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
