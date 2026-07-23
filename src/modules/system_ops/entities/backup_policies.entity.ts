import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'backup_policies' })
export class BackupPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'resource_scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceScopeConceptId!: string;

  @Property({ fieldName: 'backup_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  backupTypeConceptId!: string;

  @Property({ fieldName: 'rpo_seconds', columnType: 'int', nullable: true })
  rpoSeconds?: number;

  @Property({ fieldName: 'rto_seconds', columnType: 'int', nullable: true })
  rtoSeconds?: number;

  @Property({ fieldName: 'retention_days', columnType: 'int', nullable: true })
  retentionDays?: number;

  @Property({
    fieldName: 'immutable_copy_required',
    type: 'boolean',
    nullable: true,
  })
  immutableCopyRequired?: boolean;

  @Property({
    fieldName: 'encryption_required',
    type: 'boolean',
    nullable: true,
  })
  encryptionRequired?: boolean;

  @Property({
    fieldName: 'restore_test_frequency_days',
    columnType: 'int',
    nullable: true,
  })
  restoreTestFrequencyDays?: number;

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
