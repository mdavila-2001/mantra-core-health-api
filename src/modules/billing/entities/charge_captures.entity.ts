import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'charge_captures' })
export class ChargeCaptures {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices (inferida)
  practiceId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles (inferida)
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters (inferida)
  encounterId!: string;

  @Property({ fieldName: 'source_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  sourceKindConceptId!: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid' })
  sourceRefId!: string;

  @Property({ fieldName: 'service_date', columnType: 'date' })
  serviceDate!: Date;

  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces (inferida)
  careSpaceId?: string;

  @Property({
    fieldName: 'bed_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts (inferida)
  bedCategoryConceptId?: string;

  @Property({ fieldName: 'space_tariff_id', type: 'uuid', nullable: true }) // FK → billing.space_tariffs (inferida)
  spaceTariffId?: string;

  @Property({ fieldName: 'service_catalog_id', type: 'uuid', nullable: true }) // FK → billing.service_catalog (inferida)
  serviceCatalogId?: string;

  @Property({ fieldName: 'minimum_stay_charge', type: 'boolean' })
  minimumStayCharge!: boolean;

  @Property({ columnType: 'numeric' })
  quantity!: string;

  @Property({
    fieldName: 'unit_price',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  unitPrice?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  currencyConceptId?: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers (inferida)
  costCenterId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({ fieldName: 'invoice_line_id', type: 'uuid', nullable: true }) // FK → billing.invoice_lines (inferida)
  invoiceLineId?: string;

  @Property({ fieldName: 'void_reason', columnType: 'varchar', nullable: true })
  voidReason?: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
