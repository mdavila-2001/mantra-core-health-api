import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `preoperative_risk_scores`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'preoperative_risk_scores',
})
export class PreoperativeRiskScores {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a preoperative assessment.
   */
  @Property({ fieldName: 'preoperative_assessment_id', type: 'uuid' }) // FK → procedures_perioperative.preoperative_assessments
  preoperativeAssessmentId!: string;

  /**
   * Identificador asociado a risk model concept.
   */
  @Property({ fieldName: 'risk_model_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  riskModelConceptId!: string;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @Property({ fieldName: 'model_version', columnType: 'varchar' })
  modelVersion!: string;

  /**
   * Valor de score value mantenido por la instancia.
   */
  @Property({ fieldName: 'score_value', columnType: 'numeric(12,6)' })
  scoreValue!: string;

  /**
   * Identificador asociado a risk category concept.
   */
  @Property({
    fieldName: 'risk_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  riskCategoryConceptId?: string;

  /**
   * Valor de inputs json mantenido por la instancia.
   */
  @Property({
    fieldName: 'inputs_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  inputsJson?: unknown;

  /**
   * Valor de interpretation text mantenido por la instancia.
   */
  @Property({
    fieldName: 'interpretation_text',
    columnType: 'text',
    nullable: true,
  })
  interpretationText?: string;

  /**
   * Valor de calculated at mantenido por la instancia.
   */
  @Property({ fieldName: 'calculated_at', columnType: 'timestamptz' })
  calculatedAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
