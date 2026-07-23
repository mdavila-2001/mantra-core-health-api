import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'consistency_policies' })
export class ConsistencyPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'read_consistency', columnType: 'varchar' })
  readConsistency!: string;

  @Property({ fieldName: 'write_consistency', columnType: 'varchar' })
  writeConsistency!: string;

  @Property({ fieldName: 'conflict_resolution', columnType: 'varchar' })
  conflictResolution!: string;

  @Property({ fieldName: 'stale_read_tolerance_seconds', columnType: 'int' })
  staleReadToleranceSeconds!: number;

  @Property({ fieldName: 'requires_read_your_writes', type: 'boolean' })
  requiresReadYourWrites!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;
}
