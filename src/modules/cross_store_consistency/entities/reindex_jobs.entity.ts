import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `reindex_jobs`.
 */
@Entity({ schema: 'cross_store_consistency', tableName: 'reindex_jobs' })
export class ReindexJobs {
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
   * Valor de source alias mantenido por la instancia.
   */
  @Property({ fieldName: 'source_alias', columnType: 'varchar' })
  sourceAlias!: string;

  /**
   * Valor de target index mantenido por la instancia.
   */
  @Property({ fieldName: 'target_index', columnType: 'varchar' })
  targetIndex!: string;

  /**
   * Valor de target schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'target_schema_version', columnType: 'varchar' })
  targetSchemaVersion!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de processed count mantenido por la instancia.
   */
  @Property({ fieldName: 'processed_count', type: 'bigint' })
  processedCount!: string;

  /**
   * Valor de failed count mantenido por la instancia.
   */
  @Property({ fieldName: 'failed_count', type: 'bigint' })
  failedCount!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
