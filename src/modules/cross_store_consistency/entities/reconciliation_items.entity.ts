import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'reconciliation_items',
})
export class ReconciliationItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'reconciliation_run_id', type: 'uuid' })
  reconciliationRunId!: string;

  @Property({ fieldName: 'canonical_entity_id', type: 'uuid' })
  canonicalEntityId!: string;

  @Property({ fieldName: 'canonical_version', type: 'bigint' })
  canonicalVersion!: string;

  @Property({ fieldName: 'target_document_id', columnType: 'varchar' })
  targetDocumentId!: string;

  @Property({ fieldName: 'target_version', columnType: 'varchar' })
  targetVersion!: string;

  @Property({ fieldName: 'canonical_hash', columnType: 'varchar' })
  canonicalHash!: string;

  @Property({ fieldName: 'target_hash', columnType: 'varchar' })
  targetHash!: string;

  @Property({ columnType: 'varchar' })
  result!: string;

  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;
}
