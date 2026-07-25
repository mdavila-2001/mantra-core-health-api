import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'preoperative_assessments',
})
export class PreoperativeAssessments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'assessment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assessmentTypeConceptId!: string;

  @Property({ fieldName: 'assessed_by_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  assessedByProfileId!: string;

  @Property({ fieldName: 'assessed_at', columnType: 'timestamptz' })
  assessedAt!: Date;

  @Property({ fieldName: 'fitness_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fitnessStatusConceptId!: string;

  @Property({ fieldName: 'asa_class_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  asaClassConceptId?: string;

  @Property({
    fieldName: 'airway_class_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  airwayClassConceptId?: string;

  @Property({
    fieldName: 'bleeding_risk_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  bleedingRiskConceptId?: string;

  @Property({
    fieldName: 'infection_risk_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  infectionRiskConceptId?: string;

  @Property({
    fieldName: 'nutrition_risk_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  nutritionRiskConceptId?: string;

  @Property({
    fieldName: 'pregnancy_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  pregnancyStatusConceptId?: string;

  @Property({
    fieldName: 'allergies_reviewed',
    type: 'boolean',
    nullable: true,
  })
  allergiesReviewed?: boolean;

  @Property({
    fieldName: 'medications_reviewed',
    type: 'boolean',
    nullable: true,
  })
  medicationsReviewed?: boolean;

  @Property({
    fieldName: 'anticoagulation_plan_text',
    columnType: 'text',
    nullable: true,
  })
  anticoagulationPlanText?: string;

  @Property({
    fieldName: 'fasting_instructions_text',
    columnType: 'text',
    nullable: true,
  })
  fastingInstructionsText?: string;

  @Property({
    fieldName: 'assessment_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  assessmentJson?: unknown;

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
