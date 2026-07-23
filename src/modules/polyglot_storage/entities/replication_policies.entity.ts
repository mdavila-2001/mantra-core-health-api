import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'replication_policies' })
export class ReplicationPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'replica_count', columnType: 'smallint' })
  replicaCount!: number;

  @Property({ fieldName: 'replication_mode', columnType: 'varchar' })
  replicationMode!: string;

  @Property({ fieldName: 'cross_region_enabled', type: 'boolean' })
  crossRegionEnabled!: boolean;

  @Property({ fieldName: 'max_replication_lag_seconds', columnType: 'int' })
  maxReplicationLagSeconds!: number;

  @Property({ fieldName: 'failover_mode', columnType: 'varchar' })
  failoverMode!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
