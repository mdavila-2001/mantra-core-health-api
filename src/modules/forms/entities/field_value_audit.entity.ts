import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_value_audit' })
export class FieldValueAudit {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'field_value_id', type: 'uuid' }) // FK → forms.field_values
  fieldValueId!: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

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

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
