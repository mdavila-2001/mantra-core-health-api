import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'sterility_verification_checks',
})
export class SterilityVerificationChecks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'check_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checkTypeConceptId!: string;

  @Property({ fieldName: 'checked_at', columnType: 'timestamptz' })
  checkedAt!: Date;

  @Property({ fieldName: 'checked_by_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  checkedByProfileId!: string;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({
    fieldName: 'sterilization_load_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  sterilizationLoadId?: string;

  @Property({ fieldName: 'instrument_set_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  instrumentSetId?: string;

  @Property({
    fieldName: 'biological_indicator_reference',
    columnType: 'varchar',
    nullable: true,
  })
  biologicalIndicatorReference?: string;

  @Property({
    fieldName: 'chemical_indicator_reference',
    columnType: 'varchar',
    nullable: true,
  })
  chemicalIndicatorReference?: string;

  @Property({ fieldName: 'exception_text', columnType: 'text', nullable: true })
  exceptionText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
