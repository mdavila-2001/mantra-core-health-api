import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_quality_runs`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_quality_runs' })
export class LakehouseQualityRuns {
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
   * Identificador asociado a lakehouse dataset.
   */
  @Property({ fieldName: 'lakehouse_dataset_id', type: 'uuid' })
  lakehouseDatasetId!: string;

  /**
   * Identificador asociado a transformation run.
   */
  @Property({ fieldName: 'transformation_run_id', type: 'uuid' })
  transformationRunId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de evaluated record count mantenido por la instancia.
   */
  @Property({ fieldName: 'evaluated_record_count', type: 'bigint' })
  evaluatedRecordCount!: string;

  /**
   * Valor de failed record count mantenido por la instancia.
   */
  @Property({ fieldName: 'failed_record_count', type: 'bigint' })
  failedRecordCount!: string;

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
