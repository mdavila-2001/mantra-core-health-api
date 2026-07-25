import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'iam', tableName: 'account_lockouts' })
export class AccountLockouts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  @Property({ fieldName: 'failed_attempts', columnType: 'int', nullable: true })
  failedAttempts?: number;

  @Property({
    fieldName: 'locked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockedAt?: Date;

  @Property({
    fieldName: 'locked_until',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockedUntil?: Date;

  @Property({
    fieldName: 'unlocked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  unlockedAt?: Date;

  @Property({ fieldName: 'unlocked_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  unlockedByUserId?: string;

  @Property({ fieldName: 'source_ip', columnType: 'varchar', nullable: true })
  sourceIp?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
