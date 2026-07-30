import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cache_invalidation_jobs`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'cache_invalidation_jobs',
})
export class CacheInvalidationJobs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a dataset.
   */
  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  /**
   * Identificador asociado a entity.
   */
  @Property({ fieldName: 'entity_id', type: 'uuid' })
  entityId!: string;

  /**
   * Valor de entity version mantenido por la instancia.
   */
  @Property({ fieldName: 'entity_version', type: 'bigint' })
  entityVersion!: string;

  /**
   * Valor de cache scope mantenido por la instancia.
   */
  @Property({ fieldName: 'cache_scope', columnType: 'varchar' })
  cacheScope!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
