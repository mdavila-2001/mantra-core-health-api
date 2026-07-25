import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'entity_registry' })
export class EntityRegistry {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  @Property({ fieldName: 'table_name', columnType: 'varchar' })
  tableName!: string;

  @Property({ fieldName: 'domain_id', type: 'uuid', nullable: true }) // FK → system_ops.data_domains
  domainId?: string;

  @Property({ fieldName: 'classification_id', type: 'uuid', nullable: true }) // FK → system_ops.data_classifications
  classificationId?: string;

  @Property({ fieldName: 'is_append_only', type: 'boolean' })
  isAppendOnly!: boolean;

  @Property({ fieldName: 'is_soft_delete', type: 'boolean' })
  isSoftDelete!: boolean;

  @Property({ fieldName: 'has_history', type: 'boolean' })
  hasHistory!: boolean;

  @Property({
    fieldName: 'history_table',
    columnType: 'varchar',
    nullable: true,
  })
  historyTable?: string;

  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.retention_policies
  retentionPolicyId?: string;

  @Property({ fieldName: 'partition_spec_id', type: 'uuid', nullable: true }) // FK → system_ops.partition_specs
  partitionSpecId?: string;

  @Property({ fieldName: 'write_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.write_policies
  writePolicyId?: string;

  @Property({ fieldName: 'owner_team', columnType: 'varchar', nullable: true })
  ownerTeam?: string;

  @Property({ fieldName: 'contains_pii', type: 'boolean', nullable: true })
  containsPii?: boolean;

  @Property({ fieldName: 'contains_phi', type: 'boolean', nullable: true })
  containsPhi?: boolean;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
