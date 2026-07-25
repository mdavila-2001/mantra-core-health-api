import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'schedule_templates' })
export class ScheduleTemplates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'resource_id', type: 'uuid' }) // FK → scheduling.schedulable_resources
  resourceId!: string;

  @Property({
    fieldName: 'practitioner_schedule_id',
    type: 'uuid',
    nullable: true,
  }) // FK → scheduling.practitioner_schedules
  practitionerScheduleId?: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'slot_minutes', columnType: 'int', nullable: true })
  slotMinutes?: number;

  @Property({ fieldName: 'booking_policy_id', type: 'uuid', nullable: true }) // FK → scheduling.booking_policies
  bookingPolicyId?: string;

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
