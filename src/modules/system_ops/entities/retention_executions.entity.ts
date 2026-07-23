import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'retention_executions' })
export class RetentionExecutions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'retention_policy_id', type: 'uuid' }) // FK → system_ops.retention_policies
  retentionPolicyId!: string;

  @Property({ fieldName: 'entity_registry_id', type: 'uuid', nullable: true }) // FK → system_ops.entity_registry
  entityRegistryId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'total_scanned', type: 'bigint', nullable: true })
  totalScanned?: string;

  @Property({ fieldName: 'total_deleted', type: 'bigint', nullable: true })
  totalDeleted?: string;

  @Property({ fieldName: 'total_anonymized', type: 'bigint', nullable: true })
  totalAnonymized?: string;

  @Property({ fieldName: 'total_archived', type: 'bigint', nullable: true })
  totalArchived?: string;

  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
