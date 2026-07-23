import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'cross_store_consistency', tableName: 'deletion_targets' })
export class DeletionTargets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'deletion_request_id', type: 'uuid' })
  deletionRequestId!: string;

  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  @Property({ fieldName: 'backend_code', columnType: 'varchar' })
  backendCode!: string;

  @Property({ fieldName: 'target_locator', columnType: 'varchar' })
  targetLocator!: string;

  @Property({ fieldName: 'deletion_mode', columnType: 'varchar' })
  deletionMode!: string;

  @Property({ fieldName: 'blocked_by_legal_hold', type: 'boolean' })
  blockedByLegalHold!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;
}
