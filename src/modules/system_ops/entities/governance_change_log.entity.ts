import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'governance_change_log' })
export class GovernanceChangeLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'target_type', columnType: 'varchar' })
  targetType!: string;

  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({ fieldName: 'changed_by_user_id', type: 'uuid' }) // FK → iam.users
  changedByUserId!: string;

  @Property({
    fieldName: 'previous_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  previousSnapshotJson?: unknown;

  @Property({
    fieldName: 'new_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  newSnapshotJson?: unknown;

  @Property({ columnType: 'text', nullable: true })
  reason?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
