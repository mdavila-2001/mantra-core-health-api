import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'store_consistency_slos',
})
export class StoreConsistencySlos {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'target_backend_code', columnType: 'varchar' })
  targetBackendCode!: string;

  @Property({ fieldName: 'max_projection_lag_seconds', columnType: 'int' })
  maxProjectionLagSeconds!: number;

  @Property({ fieldName: 'max_drift_rate', columnType: 'numeric(8,6)' })
  maxDriftRate!: string;

  @Property({ fieldName: 'reconciliation_interval_minutes', columnType: 'int' })
  reconciliationIntervalMinutes!: number;

  @Property({ fieldName: 'alert_policy_code', columnType: 'varchar' })
  alertPolicyCode!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
