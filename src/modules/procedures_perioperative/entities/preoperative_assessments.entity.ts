import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `preoperative_assessments`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'preoperative_assessments',
})
export class PreoperativeAssessments {
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
   * Identificador asociado a assessment type concept.
   */
  @Property({ fieldName: 'assessment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assessmentTypeConceptId!: string;

  /**
   * Identificador asociado a assessed by profile.
   */
  @Property({ fieldName: 'assessed_by_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  assessedByProfileId!: string;

  /**
   * Valor de assessed at mantenido por la instancia.
   */
  @Property({ fieldName: 'assessed_at', columnType: 'timestamptz' })
  assessedAt!: Date;

  /**
   * Identificador asociado a fitness status concept.
   */
  @Property({ fieldName: 'fitness_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fitnessStatusConceptId!: string;

  /**
   * Identificador asociado a asa class concept.
   */
  @Property({ fieldName: 'asa_class_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  asaClassConceptId?: string;

  /**
   * Identificador asociado a airway class concept.
   */
  @Property({
    fieldName: 'airway_class_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  airwayClassConceptId?: string;

  /**
   * Identificador asociado a bleeding risk concept.
   */
  @Property({
    fieldName: 'bleeding_risk_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  bleedingRiskConceptId?: string;

  /**
   * Identificador asociado a infection risk concept.
   */
  @Property({
    fieldName: 'infection_risk_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  infectionRiskConceptId?: string;

  /**
   * Identificador asociado a nutrition risk concept.
   */
  @Property({
    fieldName: 'nutrition_risk_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  nutritionRiskConceptId?: string;

  /**
   * Identificador asociado a pregnancy status concept.
   */
  @Property({
    fieldName: 'pregnancy_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  pregnancyStatusConceptId?: string;

  /**
   * Valor de allergies reviewed mantenido por la instancia.
   */
  @Property({
    fieldName: 'allergies_reviewed',
    type: 'boolean',
    nullable: true,
  })
  allergiesReviewed?: boolean;

  /**
   * Valor de medications reviewed mantenido por la instancia.
   */
  @Property({
    fieldName: 'medications_reviewed',
    type: 'boolean',
    nullable: true,
  })
  medicationsReviewed?: boolean;

  /**
   * Valor de anticoagulation plan text mantenido por la instancia.
   */
  @Property({
    fieldName: 'anticoagulation_plan_text',
    columnType: 'text',
    nullable: true,
  })
  anticoagulationPlanText?: string;

  /**
   * Valor de fasting instructions text mantenido por la instancia.
   */
  @Property({
    fieldName: 'fasting_instructions_text',
    columnType: 'text',
    nullable: true,
  })
  fastingInstructionsText?: string;

  /**
   * Valor de assessment json mantenido por la instancia.
   */
  @Property({
    fieldName: 'assessment_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  assessmentJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
