import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `replication_policies`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'replication_policies' })
export class ReplicationPolicies {
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
   * Valor de replica count mantenido por la instancia.
   */
  @Property({ fieldName: 'replica_count', columnType: 'smallint' })
  replicaCount!: number;

  /**
   * Valor de replication mode mantenido por la instancia.
   */
  @Property({ fieldName: 'replication_mode', columnType: 'varchar' })
  replicationMode!: string;

  /**
   * Valor de cross region enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'cross_region_enabled', type: 'boolean' })
  crossRegionEnabled!: boolean;

  /**
   * Valor de max replication lag seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'max_replication_lag_seconds', columnType: 'int' })
  maxReplicationLagSeconds!: number;

  /**
   * Valor de failover mode mantenido por la instancia.
   */
  @Property({ fieldName: 'failover_mode', columnType: 'varchar' })
  failoverMode!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
