import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'cross_store_consistency', tableName: 'reconciliation_runs' })
export class CrossStoreConsistencyReconciliationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'source_backend_code', columnType: 'varchar' })
  sourceBackendCode!: string;

  @Property({ fieldName: 'target_backend_code', columnType: 'varchar' })
  targetBackendCode!: string;

  @Property({
    fieldName: 'reconciliation_scope_json',
    type: 'json',
    columnType: 'jsonb',
  })
  reconciliationScopeJson!: unknown;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
