import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'schedule_rules' })
export class ScheduleRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'schedule_template_id', type: 'uuid' }) // FK → scheduling.schedule_templates
  scheduleTemplateId!: string;

  @Property({ fieldName: 'day_of_week', columnType: 'int' })
  dayOfWeek!: number;

  @Property({ fieldName: 'start_time', columnType: 'time' })
  startTime!: string;

  @Property({ fieldName: 'end_time', columnType: 'time' })
  endTime!: string;

  @Property({ fieldName: 'slot_minutes', columnType: 'int', nullable: true })
  slotMinutes?: number;

  @Property({
    fieldName: 'capacity_per_slot',
    columnType: 'int',
    nullable: true,
  })
  capacityPerSlot?: number;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
