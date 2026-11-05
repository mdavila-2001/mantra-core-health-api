import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `dependency_probe_runs`.
 */
@Entity({ schema: 'observability', tableName: 'dependency_probe_runs' })
export class DependencyProbeRuns {
  /**
   * Valor de time mantenido por la instancia.
   */
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  /**
   * Identificador asociado a instance.
   */
  @PrimaryKey({ fieldName: 'instance_id', type: 'uuid' })
  instanceId!: string;

  /**
   * Valor de dependency code mantenido por la instancia.
   */
  @PrimaryKey({ fieldName: 'dependency_code', columnType: 'varchar' })
  dependencyCode!: string;

  /**
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid', nullable: true }) // FK → platform_ops.service_components (inferida)
  serviceComponentId?: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de latency ms mantenido por la instancia.
   */
  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  /**
   * Valor de error type mantenido por la instancia.
   */
  @Property({ fieldName: 'error_type', columnType: 'varchar', nullable: true })
  errorType?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
