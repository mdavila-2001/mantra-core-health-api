import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_data_quality_issues' })
export class HealthDataQualityIssues {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_data_quality_run_id', type: 'uuid' }) // FK → health_data.health_data_quality_runs
  healthDataQualityRunId!: string;

  @Property({ fieldName: 'health_data_quality_rule_id', type: 'uuid' }) // FK → health_data.health_data_quality_rules
  healthDataQualityRuleId!: string;

  @Property({
    fieldName: 'canonical_health_resource_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.canonical_health_resources
  canonicalHealthResourceId?: string;

  @Property({
    fieldName: 'canonical_resource_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.canonical_health_resource_versions
  canonicalResourceVersionId?: string;

  @Property({ fieldName: 'field_path', columnType: 'varchar' })
  fieldPath!: string;

  @Property({ fieldName: 'observed_value_hash', columnType: 'varchar' })
  observedValueHash!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedUserId?: string;

  @Property({
    fieldName: 'resolution_text',
    columnType: 'text',
    nullable: true,
  })
  resolutionText?: string;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
