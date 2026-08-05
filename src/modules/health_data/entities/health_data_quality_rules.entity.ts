import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_data_quality_rules`.
 */
@Entity({ schema: 'health_data', tableName: 'health_data_quality_rules' })
export class HealthDataQualityRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health data quality rule set.
   */
  @Property({ fieldName: 'health_data_quality_rule_set_id', type: 'uuid' }) // FK → health_data.health_data_quality_rule_sets
  healthDataQualityRuleSetId!: string;

  /**
   * Valor de rule code mantenido por la instancia.
   */
  @Property({ fieldName: 'rule_code', columnType: 'varchar' })
  ruleCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a dimension concept.
   */
  @Property({ fieldName: 'dimension_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dimensionConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Identificador asociado a expression language concept.
   */
  @Property({ fieldName: 'expression_language_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  expressionLanguageConceptId!: string;

  /**
   * Valor de rule expression mantenido por la instancia.
   */
  @Property({ fieldName: 'rule_expression', columnType: 'text' })
  ruleExpression!: string;

  /**
   * Valor de remediation guidance mantenido por la instancia.
   */
  @Property({
    fieldName: 'remediation_guidance',
    columnType: 'text',
    nullable: true,
  })
  remediationGuidance?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
