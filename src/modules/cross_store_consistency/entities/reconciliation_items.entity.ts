import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `reconciliation_items`.
 */
@Entity({
  schema: 'cross_store_consistency',
  tableName: 'reconciliation_items',
})
export class ReconciliationItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a reconciliation run.
   */
  @Property({ fieldName: 'reconciliation_run_id', type: 'uuid' })
  reconciliationRunId!: string;

  /**
   * Identificador asociado a canonical entity.
   */
  @Property({ fieldName: 'canonical_entity_id', type: 'uuid' })
  canonicalEntityId!: string;

  /**
   * Valor de canonical version mantenido por la instancia.
   */
  @Property({ fieldName: 'canonical_version', type: 'bigint' })
  canonicalVersion!: string;

  /**
   * Identificador asociado a target document.
   */
  @Property({ fieldName: 'target_document_id', columnType: 'varchar' })
  targetDocumentId!: string;

  /**
   * Valor de target version mantenido por la instancia.
   */
  @Property({ fieldName: 'target_version', columnType: 'varchar' })
  targetVersion!: string;

  /**
   * Valor de canonical hash mantenido por la instancia.
   */
  @Property({ fieldName: 'canonical_hash', columnType: 'varchar' })
  canonicalHash!: string;

  /**
   * Valor de target hash mantenido por la instancia.
   */
  @Property({ fieldName: 'target_hash', columnType: 'varchar' })
  targetHash!: string;

  /**
   * Valor de result mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  result!: string;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;
}
