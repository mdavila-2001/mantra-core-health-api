import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_retention_locks' })
export class ObjectRetentionLocks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  @Property({ fieldName: 'lock_mode', columnType: 'varchar' })
  lockMode!: string;

  @Property({ fieldName: 'retain_until', columnType: 'timestamptz' })
  retainUntil!: Date;

  @Property({ fieldName: 'policy_code', columnType: 'varchar' })
  policyCode!: string;

  @Property({ fieldName: 'applied_at', columnType: 'timestamptz' })
  appliedAt!: Date;

  @Property({ fieldName: 'released_at', columnType: 'timestamptz' })
  releasedAt!: Date;
}
