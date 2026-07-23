import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_call_logs' })
export class CrmCallLogs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  @Property({ fieldName: 'call_direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  callDirectionConceptId!: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  @Property({
    fieldName: 'duration_seconds',
    columnType: 'int',
    nullable: true,
  })
  durationSeconds?: number;

  @Property({
    fieldName: 'from_number_masked',
    columnType: 'varchar',
    nullable: true,
  })
  fromNumberMasked?: string;

  @Property({
    fieldName: 'to_number_masked',
    columnType: 'varchar',
    nullable: true,
  })
  toNumberMasked?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  @Property({ fieldName: 'recording_file_id', type: 'uuid', nullable: true }) // FK → common.files
  recordingFileId?: string;

  @Property({
    fieldName: 'external_call_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalCallId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
