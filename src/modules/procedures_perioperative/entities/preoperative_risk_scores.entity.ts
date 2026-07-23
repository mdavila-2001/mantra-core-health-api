import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'preoperative_risk_scores',
})
export class PreoperativeRiskScores {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'preoperative_assessment_id', type: 'uuid' }) // FK → procedures_perioperative.preoperative_assessments
  preoperativeAssessmentId!: string;

  @Property({ fieldName: 'risk_model_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  riskModelConceptId!: string;

  @Property({ fieldName: 'model_version', columnType: 'varchar' })
  modelVersion!: string;

  @Property({ fieldName: 'score_value', columnType: 'numeric(12,6)' })
  scoreValue!: string;

  @Property({
    fieldName: 'risk_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  riskCategoryConceptId?: string;

  @Property({
    fieldName: 'inputs_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  inputsJson?: unknown;

  @Property({
    fieldName: 'interpretation_text',
    columnType: 'text',
    nullable: true,
  })
  interpretationText?: string;

  @Property({ fieldName: 'calculated_at', columnType: 'timestamptz' })
  calculatedAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
