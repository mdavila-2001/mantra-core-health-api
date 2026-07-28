import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `data_movement_jobs`.
 */
@Entity({ schema: 'cross_store_consistency', tableName: 'data_movement_jobs' })
export class DataMovementJobs {
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
   * Identificador asociado a source placement.
   */
  @Property({ fieldName: 'source_placement_id', type: 'uuid' })
  sourcePlacementId!: string;

  /**
   * Identificador asociado a target placement.
   */
  @Property({ fieldName: 'target_placement_id', type: 'uuid' })
  targetPlacementId!: string;

  /**
   * Valor de movement mode mantenido por la instancia.
   */
  @Property({ fieldName: 'movement_mode', columnType: 'varchar' })
  movementMode!: string;

  /**
   * Valor de manifest hash mantenido por la instancia.
   */
  @Property({ fieldName: 'manifest_hash', columnType: 'varchar' })
  manifestHash!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

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
