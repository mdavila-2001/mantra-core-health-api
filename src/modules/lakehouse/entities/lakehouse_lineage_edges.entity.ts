import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_lineage_edges`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_lineage_edges' })
export class LakehouseLineageEdges {
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
   * Identificador asociado a source dataset.
   */
  @Property({ fieldName: 'source_dataset_id', type: 'uuid' })
  sourceDatasetId!: string;

  /**
   * Identificador asociado a target dataset.
   */
  @Property({ fieldName: 'target_dataset_id', type: 'uuid' })
  targetDatasetId!: string;

  /**
   * Identificador asociado a transformation run.
   */
  @Property({ fieldName: 'transformation_run_id', type: 'uuid' })
  transformationRunId!: string;

  /**
   * Identificador asociado a source partition.
   */
  @Property({ fieldName: 'source_partition_id', type: 'uuid' })
  sourcePartitionId!: string;

  /**
   * Identificador asociado a target partition.
   */
  @Property({ fieldName: 'target_partition_id', type: 'uuid' })
  targetPartitionId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
