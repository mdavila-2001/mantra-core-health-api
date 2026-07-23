import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_data_quality_rules' })
export class HealthDataQualityRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_data_quality_rule_set_id', type: 'uuid' }) // FK → health_data.health_data_quality_rule_sets
  healthDataQualityRuleSetId!: string;

  @Property({ fieldName: 'rule_code', columnType: 'varchar' })
  ruleCode!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'dimension_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dimensionConceptId!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ fieldName: 'expression_language_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  expressionLanguageConceptId!: string;

  @Property({ fieldName: 'rule_expression', columnType: 'text' })
  ruleExpression!: string;

  @Property({
    fieldName: 'remediation_guidance',
    columnType: 'text',
    nullable: true,
  })
  remediationGuidance?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
