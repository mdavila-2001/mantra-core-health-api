import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'breach_notifications' })
export class BreachNotifications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'security_incident_id', type: 'uuid' }) // FK → system_ops.security_incidents
  securityIncidentId!: string;

  @Property({ fieldName: 'authority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  authorityConceptId!: string;

  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  @Property({
    fieldName: 'regulation_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  regulationConceptId?: string;

  @Property({
    fieldName: 'deadline_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deadlineAt?: Date;

  @Property({
    fieldName: 'notified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  notifiedAt?: Date;

  @Property({
    fieldName: 'affected_subjects',
    columnType: 'int',
    nullable: true,
  })
  affectedSubjects?: number;

  @Property({
    fieldName: 'notification_channel_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  notificationChannelConceptId?: string;

  @Property({
    fieldName: 'reference_number',
    columnType: 'varchar',
    nullable: true,
  })
  referenceNumber?: string;

  @Property({ fieldName: 'subjects_notified', type: 'boolean', nullable: true })
  subjectsNotified?: boolean;

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
