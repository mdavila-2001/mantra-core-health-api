import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `sterility_verification_checks`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'sterility_verification_checks',
})
export class SterilityVerificationChecks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  /**
   * Identificador asociado a check type concept.
   */
  @Property({ fieldName: 'check_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checkTypeConceptId!: string;

  /**
   * Valor de checked at mantenido por la instancia.
   */
  @Property({ fieldName: 'checked_at', columnType: 'timestamptz' })
  checkedAt!: Date;

  /**
   * Identificador asociado a checked by profile.
   */
  @Property({ fieldName: 'checked_by_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  checkedByProfileId!: string;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Identificador asociado a sterilization load.
   */
  @Property({
    fieldName: 'sterilization_load_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  sterilizationLoadId?: string;

  /**
   * Identificador asociado a instrument set.
   */
  @Property({ fieldName: 'instrument_set_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  instrumentSetId?: string;

  /**
   * Valor de biological indicator reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'biological_indicator_reference',
    columnType: 'varchar',
    nullable: true,
  })
  biologicalIndicatorReference?: string;

  /**
   * Valor de chemical indicator reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'chemical_indicator_reference',
    columnType: 'varchar',
    nullable: true,
  })
  chemicalIndicatorReference?: string;

  /**
   * Valor de exception text mantenido por la instancia.
   */
  @Property({ fieldName: 'exception_text', columnType: 'text', nullable: true })
  exceptionText?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
