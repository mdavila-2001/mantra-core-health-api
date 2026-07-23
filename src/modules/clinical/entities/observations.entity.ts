import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'observations' })
export class Observations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({
    fieldName: 'based_on_service_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.service_requests
  basedOnServiceRequestId?: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'value_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  valueTypeConceptId!: string;

  @Property({
    fieldName: 'value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  valueDecimal?: string;

  @Property({ fieldName: 'value_integer', type: 'bigint', nullable: true })
  valueInteger?: string;

  @Property({ fieldName: 'value_boolean', type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  @Property({ fieldName: 'value_text', columnType: 'text', nullable: true })
  valueText?: string;

  @Property({ fieldName: 'value_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  valueConceptId?: string;

  @Property({
    fieldName: 'value_datetime',
    columnType: 'timestamptz',
    nullable: true,
  })
  valueDatetime?: Date;

  @Property({ fieldName: 'value_date', columnType: 'date', nullable: true })
  valueDate?: Date;

  @Property({
    fieldName: 'quantity_value',
    columnType: 'numeric',
    nullable: true,
  })
  quantityValue?: string;

  @Property({
    fieldName: 'quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quantityUnitConceptId?: string;

  @Property({
    fieldName: 'range_low_value',
    columnType: 'numeric',
    nullable: true,
  })
  rangeLowValue?: string;

  @Property({
    fieldName: 'range_high_value',
    columnType: 'numeric',
    nullable: true,
  })
  rangeHighValue?: string;

  @Property({
    fieldName: 'range_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  rangeUnitConceptId?: string;

  @Property({
    fieldName: 'ratio_numerator_value',
    columnType: 'numeric',
    nullable: true,
  })
  ratioNumeratorValue?: string;

  @Property({
    fieldName: 'ratio_numerator_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  ratioNumeratorUnitConceptId?: string;

  @Property({
    fieldName: 'ratio_denominator_value',
    columnType: 'numeric',
    nullable: true,
  })
  ratioDenominatorValue?: string;

  @Property({
    fieldName: 'ratio_denominator_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  ratioDenominatorUnitConceptId?: string;

  @Property({
    fieldName: 'sampled_data_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sampledDataJson?: unknown;

  @Property({ fieldName: 'value_file_id', type: 'uuid', nullable: true }) // FK → common.files
  valueFileId?: string;

  @Property({
    fieldName: 'value_reference_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  valueReferenceTypeConceptId?: string;

  @Property({ fieldName: 'value_reference_id', type: 'uuid', nullable: true })
  valueReferenceId?: string;

  @Property({
    fieldName: 'data_absent_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataAbsentReasonConceptId?: string;

  @Property({
    fieldName: 'interpretation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  interpretationConceptId?: string;

  @Property({ fieldName: 'method_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  methodConceptId?: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({ fieldName: 'specimen_id', type: 'uuid', nullable: true }) // FK → diagnostics.specimens
  specimenId?: string;

  @Property({ fieldName: 'source_device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  sourceDeviceId?: string;

  @Property({
    fieldName: 'effective_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveStartAt?: Date;

  @Property({
    fieldName: 'effective_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveEndAt?: Date;

  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

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
