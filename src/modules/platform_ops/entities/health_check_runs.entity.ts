import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'health_check_runs' })
export class HealthCheckRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_check_id', type: 'uuid' }) // FK → platform_ops.health_checks
  healthCheckId!: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid', nullable: true }) // FK → platform_ops.service_components
  serviceComponentId?: string;

  @Property({ fieldName: 'deployment_id', type: 'uuid', nullable: true }) // FK → platform_ops.deployments
  deploymentId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  @Property({
    fieldName: 'observed_value',
    columnType: 'varchar',
    nullable: true,
  })
  observedValue?: string;

  @Property({ columnType: 'text', nullable: true })
  message?: string;

  @Property({
    fieldName: 'run_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  runSourceConceptId?: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
