import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'cache_invalidation_jobs',
})
export class CacheInvalidationJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Property({ fieldName: 'entity_version', type: 'bigint' })
  entityVersion!: string;

  @Property({ fieldName: 'cache_scope', columnType: 'varchar' })
  cacheScope!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
