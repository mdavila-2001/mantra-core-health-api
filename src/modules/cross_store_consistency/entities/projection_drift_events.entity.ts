import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `projection_drift_events`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_drift_events',
})
export class ProjectionDriftEvents {
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
   * Identificador asociado a canonical entity.
   */
  @Property({ fieldName: 'canonical_entity_id', type: 'uuid' })
  canonicalEntityId!: string;

  /**
   * Valor de drift type mantenido por la instancia.
   */
  @Property({ fieldName: 'drift_type', columnType: 'varchar' })
  driftType!: string;

  /**
   * Valor de severity mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  severity!: string;

  /**
   * Valor de canonical version mantenido por la instancia.
   */
  @Property({ fieldName: 'canonical_version', type: 'bigint' })
  canonicalVersion!: string;

  /**
   * Valor de target version mantenido por la instancia.
   */
  @Property({ fieldName: 'target_version', columnType: 'varchar' })
  targetVersion!: string;

  /**
   * Identificador asociado a reconciliation item.
   */
  @Property({ fieldName: 'reconciliation_item_id', type: 'uuid' })
  reconciliationItemId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;
}
