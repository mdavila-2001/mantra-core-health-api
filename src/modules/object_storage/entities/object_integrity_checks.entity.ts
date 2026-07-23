import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_integrity_checks' })
export class ObjectIntegrityChecks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  @Property({ fieldName: 'check_type', columnType: 'varchar' })
  checkType!: string;

  @Property({ fieldName: 'expected_hash', columnType: 'varchar' })
  expectedHash!: string;

  @Property({ fieldName: 'actual_hash', columnType: 'varchar' })
  actualHash!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'checked_at', columnType: 'timestamptz' })
  checkedAt!: Date;

  @Property({ fieldName: 'repair_job_id', type: 'uuid' })
  repairJobId!: string;
}
