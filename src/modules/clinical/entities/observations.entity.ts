import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `observations`.
 */
@Entity({ schema: 'clinical', tableName: 'observations' })
export class Observations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a based on service request.
   */
  @Property({
    fieldName: 'based_on_service_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.service_requests
  basedOnServiceRequestId?: string;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  /**
   * Identificador asociado a code concept.
   */
  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a value type concept.
   */
  @Property({ fieldName: 'value_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  valueTypeConceptId!: string;

  /**
   * Valor de value decimal mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  valueDecimal?: string;

  /**
   * Valor de value integer mantenido por la instancia.
   */
  @Property({ fieldName: 'value_integer', type: 'bigint', nullable: true })
  valueInteger?: string;

  /**
   * Valor de value boolean mantenido por la instancia.
   */
  @Property({ fieldName: 'value_boolean', type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  /**
   * Valor de value text mantenido por la instancia.
   */
  @Property({ fieldName: 'value_text', columnType: 'text', nullable: true })
  valueText?: string;

  /**
   * Identificador asociado a value concept.
   */
  @Property({ fieldName: 'value_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  valueConceptId?: string;

  /**
   * Valor de value datetime mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_datetime',
    columnType: 'timestamptz',
    nullable: true,
  })
  valueDatetime?: Date;

  /**
   * Valor de value date mantenido por la instancia.
   */
  @Property({ fieldName: 'value_date', columnType: 'date', nullable: true })
  valueDate?: Date;

  /**
   * Valor de quantity value mantenido por la instancia.
   */
  @Property({
    fieldName: 'quantity_value',
    columnType: 'numeric',
    nullable: true,
  })
  quantityValue?: string;

  /**
   * Identificador asociado a quantity unit concept.
   */
  @Property({
    fieldName: 'quantity_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quantityUnitConceptId?: string;

  /**
   * Valor de range low value mantenido por la instancia.
   */
  @Property({
    fieldName: 'range_low_value',
    columnType: 'numeric',
    nullable: true,
  })
  rangeLowValue?: string;

  /**
   * Valor de range high value mantenido por la instancia.
   */
  @Property({
    fieldName: 'range_high_value',
    columnType: 'numeric',
    nullable: true,
  })
  rangeHighValue?: string;

  /**
   * Identificador asociado a range unit concept.
   */
  @Property({
    fieldName: 'range_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  rangeUnitConceptId?: string;

  /**
   * Valor de ratio numerator value mantenido por la instancia.
   */
  @Property({
    fieldName: 'ratio_numerator_value',
    columnType: 'numeric',
    nullable: true,
  })
  ratioNumeratorValue?: string;

  /**
   * Identificador asociado a ratio numerator unit concept.
   */
  @Property({
    fieldName: 'ratio_numerator_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  ratioNumeratorUnitConceptId?: string;

  /**
   * Valor de ratio denominator value mantenido por la instancia.
   */
  @Property({
    fieldName: 'ratio_denominator_value',
    columnType: 'numeric',
    nullable: true,
  })
  ratioDenominatorValue?: string;

  /**
   * Identificador asociado a ratio denominator unit concept.
   */
  @Property({
    fieldName: 'ratio_denominator_unit_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  ratioDenominatorUnitConceptId?: string;

  /**
   * Valor de sampled data json mantenido por la instancia.
   */
  @Property({
    fieldName: 'sampled_data_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sampledDataJson?: unknown;

  /**
   * Identificador asociado a value file.
   */
  @Property({ fieldName: 'value_file_id', type: 'uuid', nullable: true }) // FK → common.files
  valueFileId?: string;

  /**
   * Identificador asociado a value reference type concept.
   */
  @Property({
    fieldName: 'value_reference_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  valueReferenceTypeConceptId?: string;

  /**
   * Identificador asociado a value reference.
   */
  @Property({ fieldName: 'value_reference_id', type: 'uuid', nullable: true })
  valueReferenceId?: string;

  /**
   * Identificador asociado a data absent reason concept.
   */
  @Property({
    fieldName: 'data_absent_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataAbsentReasonConceptId?: string;

  /**
   * Identificador asociado a interpretation concept.
   */
  @Property({
    fieldName: 'interpretation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  interpretationConceptId?: string;

  /**
   * Identificador asociado a method concept.
   */
  @Property({ fieldName: 'method_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  methodConceptId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a specimen.
   */
  @Property({ fieldName: 'specimen_id', type: 'uuid', nullable: true }) // FK → diagnostics.specimens
  specimenId?: string;

  /**
   * Identificador asociado a source device.
   */
  @Property({ fieldName: 'source_device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  sourceDeviceId?: string;

  /**
   * Valor de effective start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveStartAt?: Date;

  /**
   * Valor de effective end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveEndAt?: Date;

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
