import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_data_quality_issues`.
 */
@Entity({ schema: 'health_data', tableName: 'health_data_quality_issues' })
export class HealthDataQualityIssues {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health data quality run.
   */
  @Property({ fieldName: 'health_data_quality_run_id', type: 'uuid' }) // FK → health_data.health_data_quality_runs
  healthDataQualityRunId!: string;

  /**
   * Identificador asociado a health data quality rule.
   */
  @Property({ fieldName: 'health_data_quality_rule_id', type: 'uuid' }) // FK → health_data.health_data_quality_rules
  healthDataQualityRuleId!: string;

  /**
   * Identificador asociado a canonical health resource.
   */
  @Property({
    fieldName: 'canonical_health_resource_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.canonical_health_resources
  canonicalHealthResourceId?: string;

  /**
   * Identificador asociado a canonical resource version.
   */
  @Property({
    fieldName: 'canonical_resource_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.canonical_health_resource_versions
  canonicalResourceVersionId?: string;

  /**
   * Valor de field path mantenido por la instancia.
   */
  @Property({ fieldName: 'field_path', columnType: 'varchar' })
  fieldPath!: string;

  /**
   * Valor de observed value hash mantenido por la instancia.
   */
  @Property({ fieldName: 'observed_value_hash', columnType: 'varchar' })
  observedValueHash!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a assigned user.
   */
  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedUserId?: string;

  /**
   * Valor de resolution text mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolution_text',
    columnType: 'text',
    nullable: true,
  })
  resolutionText?: string;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
