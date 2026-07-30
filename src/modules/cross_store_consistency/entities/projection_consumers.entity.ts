import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `projection_consumers`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_consumers',
})
export class ProjectionConsumers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de service name mantenido por la instancia.
   */
  @Property({ fieldName: 'service_name', columnType: 'varchar' })
  serviceName!: string;

  /**
   * Valor de deployment region mantenido por la instancia.
   */
  @Property({ fieldName: 'deployment_region', columnType: 'varchar' })
  deploymentRegion!: string;

  /**
   * Valor de consumer group mantenido por la instancia.
   */
  @Property({ fieldName: 'consumer_group', columnType: 'varchar' })
  consumerGroup!: string;

  /**
   * Valor de heartbeat at mantenido por la instancia.
   */
  @Property({ fieldName: 'heartbeat_at', columnType: 'timestamptz' })
  heartbeatAt!: Date;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
