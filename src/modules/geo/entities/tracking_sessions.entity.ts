import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'geo', tableName: 'tracking_sessions' })
export class TrackingSessions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tracked_subject_id', type: 'uuid' }) // FK → geo.tracked_subjects
  trackedSubjectId!: string;

  @Property({ fieldName: 'purpose_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  purposeConceptId?: string;

  @Property({
    fieldName: 'related_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  relatedResourceType?: string;

  @Property({ fieldName: 'related_resource_id', type: 'uuid', nullable: true })
  relatedResourceId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
