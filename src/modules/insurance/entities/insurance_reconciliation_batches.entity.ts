import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'insurance_reconciliation_batches' })
export class InsuranceReconciliationBatches {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers
  insuranceCarrierId!: string;

  @Property({ fieldName: 'provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  providerTypeConceptId!: string;

  @Property({ fieldName: 'provider_entity_id', type: 'uuid' })
  providerEntityId!: string;

  @Property({ fieldName: 'period_start', columnType: 'date' })
  periodStart!: Date;

  @Property({ fieldName: 'period_end', columnType: 'date' })
  periodEnd!: Date;

  @Property({
    fieldName: 'total_claimed_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalClaimedAmount?: string;

  @Property({
    fieldName: 'total_approved_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalApprovedAmount?: string;

  @Property({
    fieldName: 'total_paid_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalPaidAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
