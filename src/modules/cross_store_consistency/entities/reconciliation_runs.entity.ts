import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cross_store_consistency_reconciliation_runs`.
 */
@Entity({ schema: 'cross_store_consistency', tableName: 'reconciliation_runs' })
export class CrossStoreConsistencyReconciliationRuns {
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
   * Valor de source backend code mantenido por la instancia.
   */
  @Property({ fieldName: 'source_backend_code', columnType: 'varchar' })
  sourceBackendCode!: string;

  /**
   * Valor de target backend code mantenido por la instancia.
   */
  @Property({ fieldName: 'target_backend_code', columnType: 'varchar' })
  targetBackendCode!: string;

  /**
   * Valor de reconciliation scope json mantenido por la instancia.
   */
  @Property({
    fieldName: 'reconciliation_scope_json',
    type: 'json',
    columnType: 'jsonb',
  })
  reconciliationScopeJson!: unknown;

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
