import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `store_consistency_slos`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'store_consistency_slos',
})
export class StoreConsistencySlos {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dataset.
   */
  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  /**
   * Valor de target backend code mantenido por la instancia.
   */
  @Property({ fieldName: 'target_backend_code', columnType: 'varchar' })
  targetBackendCode!: string;

  /**
   * Valor de max projection lag seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'max_projection_lag_seconds', columnType: 'int' })
  maxProjectionLagSeconds!: number;

  /**
   * Valor de max drift rate mantenido por la instancia.
   */
  @Property({ fieldName: 'max_drift_rate', columnType: 'numeric(8,6)' })
  maxDriftRate!: string;

  /**
   * Valor de reconciliation interval minutes mantenido por la instancia.
   */
  @Property({ fieldName: 'reconciliation_interval_minutes', columnType: 'int' })
  reconciliationIntervalMinutes!: number;

  /**
   * Valor de alert policy code mantenido por la instancia.
   */
  @Property({ fieldName: 'alert_policy_code', columnType: 'varchar' })
  alertPolicyCode!: string;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
