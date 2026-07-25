import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'health_incidents' })
export class HealthIncidents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ fieldName: 'health_check_id', type: 'uuid', nullable: true }) // FK → platform_ops.health_checks
  healthCheckId?: string;

  @Property({ fieldName: 'incident_number', columnType: 'varchar' })
  incidentNumber!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'detected_by_run_id', type: 'uuid', nullable: true }) // FK → platform_ops.health_check_runs
  detectedByRunId?: string;

  @Property({
    fieldName: 'opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  openedAt?: Date;

  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({
    fieldName: 'root_cause_text',
    columnType: 'text',
    nullable: true,
  })
  rootCauseText?: string;

  @Property({
    fieldName: 'resolution_text',
    columnType: 'text',
    nullable: true,
  })
  resolutionText?: string;

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
