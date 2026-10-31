import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'observability', tableName: 'dependency_probe_runs' })
export class DependencyProbeRuns {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'instance_id', type: 'uuid' })
  instanceId!: string;

  @PrimaryKey({ fieldName: 'dependency_code', columnType: 'varchar' })
  dependencyCode!: string;

  @Property({ fieldName: 'service_component_id', type: 'uuid', nullable: true }) // FK → platform_ops.service_components (inferida)
  serviceComponentId?: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  @Property({ fieldName: 'error_type', columnType: 'varchar', nullable: true })
  errorType?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
