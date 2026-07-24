import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'vector_reconciliation_runs' })
export class VectorReconciliationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'vector_collection_id', type: 'uuid' })
  vectorCollectionId!: string;

  @Property({ fieldName: 'canonical_manifest_hash', columnType: 'varchar' })
  canonicalManifestHash!: string;

  @Property({ fieldName: 'vector_manifest_hash', columnType: 'varchar' })
  vectorManifestHash!: string;

  @Property({ fieldName: 'missing_count', columnType: 'int' })
  missingCount!: number;

  @Property({ fieldName: 'orphan_count', columnType: 'int' })
  orphanCount!: number;

  @Property({ fieldName: 'mismatched_count', columnType: 'int' })
  mismatchedCount!: number;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
