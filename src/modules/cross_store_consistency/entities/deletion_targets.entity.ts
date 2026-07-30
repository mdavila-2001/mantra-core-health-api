import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `deletion_targets`.
 */
@Entity({ schema: 'cross_store_consistency', tableName: 'deletion_targets' })
export class DeletionTargets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a deletion request.
   */
  @Property({ fieldName: 'deletion_request_id', type: 'uuid' })
  deletionRequestId!: string;

  /**
   * Identificador asociado a dataset.
   */
  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  /**
   * Valor de backend code mantenido por la instancia.
   */
  @Property({ fieldName: 'backend_code', columnType: 'varchar' })
  backendCode!: string;

  /**
   * Valor de target locator mantenido por la instancia.
   */
  @Property({ fieldName: 'target_locator', columnType: 'varchar' })
  targetLocator!: string;

  /**
   * Valor de deletion mode mantenido por la instancia.
   */
  @Property({ fieldName: 'deletion_mode', columnType: 'varchar' })
  deletionMode!: string;

  /**
   * Valor de blocked by legal hold mantenido por la instancia.
   */
  @Property({ fieldName: 'blocked_by_legal_hold', type: 'boolean' })
  blockedByLegalHold!: boolean;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
