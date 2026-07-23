import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'retention_policies' })
export class PolyglotStorageRetentionPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'retention_days', columnType: 'int' })
  retentionDays!: number;

  @Property({ fieldName: 'archive_after_days', columnType: 'int' })
  archiveAfterDays!: number;

  @Property({ fieldName: 'deletion_mode', columnType: 'varchar' })
  deletionMode!: string;

  @Property({ fieldName: 'legal_hold_overrides_deletion', type: 'boolean' })
  legalHoldOverridesDeletion!: boolean;

  @Property({ fieldName: 'jurisdiction_code', columnType: 'varchar' })
  jurisdictionCode!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
