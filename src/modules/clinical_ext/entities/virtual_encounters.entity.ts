import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical_ext', tableName: 'virtual_encounters' })
export class VirtualEncounters {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters
  encounterId!: string;

  @Property({ fieldName: 'platform_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  platformConceptId?: string;

  @Property({ fieldName: 'meeting_url', columnType: 'text', nullable: true })
  meetingUrl?: string;

  @Property({ fieldName: 'meeting_id', columnType: 'varchar', nullable: true })
  meetingId?: string;

  @Property({ fieldName: 'recording_file_id', type: 'uuid', nullable: true }) // FK → common.files
  recordingFileId?: string;

  @Property({
    fieldName: 'joined_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  joinedAt?: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

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
