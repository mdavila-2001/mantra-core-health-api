import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `vector_reconciliation_runs`.
 */
@Entity({ schema: 'vector_rag', tableName: 'vector_reconciliation_runs' })
export class VectorReconciliationRuns {
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
   * Identificador asociado a vector collection.
   */
  @Property({ fieldName: 'vector_collection_id', type: 'uuid' })
  vectorCollectionId!: string;

  /**
   * Valor de canonical manifest hash mantenido por la instancia.
   */
  @Property({ fieldName: 'canonical_manifest_hash', columnType: 'varchar' })
  canonicalManifestHash!: string;

  /**
   * Valor de vector manifest hash mantenido por la instancia.
   */
  @Property({ fieldName: 'vector_manifest_hash', columnType: 'varchar' })
  vectorManifestHash!: string;

  /**
   * Valor de missing count mantenido por la instancia.
   */
  @Property({ fieldName: 'missing_count', columnType: 'int' })
  missingCount!: number;

  /**
   * Valor de orphan count mantenido por la instancia.
   */
  @Property({ fieldName: 'orphan_count', columnType: 'int' })
  orphanCount!: number;

  /**
   * Valor de mismatched count mantenido por la instancia.
   */
  @Property({ fieldName: 'mismatched_count', columnType: 'int' })
  mismatchedCount!: number;

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
