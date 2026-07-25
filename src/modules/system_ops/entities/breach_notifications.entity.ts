import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'breach_notifications' })
export class BreachNotifications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'security_incident_id', type: 'uuid' })
  securityIncidentId!: string;

  @Property({ fieldName: 'authority_concept_id', type: 'uuid' })
  authorityConceptId!: string;

  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  })
  jurisdictionConceptId?: string;

  @Property({
    fieldName: 'regulation_concept_id',
    type: 'uuid',
    nullable: true,
  })
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
  })
  notificationChannelConceptId?: string;

  @Property({
    fieldName: 'reference_number',
    columnType: 'varchar',
    nullable: true,
  })
  referenceNumber?: string;

  @Property({ fieldName: 'subjects_notified', type: 'boolean', nullable: true })
  subjectsNotified?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
