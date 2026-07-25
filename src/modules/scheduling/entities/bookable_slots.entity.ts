import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'bookable_slots' })
export class BookableSlots {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'resource_id', type: 'uuid' }) // FK → scheduling.schedulable_resources
  resourceId!: string;

  @Property({ fieldName: 'schedule_template_id', type: 'uuid', nullable: true }) // FK → scheduling.schedule_templates
  scheduleTemplateId?: string;

  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  @Property({ fieldName: 'start_at', columnType: 'timestamptz' })
  startAt!: Date;

  @Property({ fieldName: 'end_at', columnType: 'timestamptz' })
  endAt!: Date;

  @Property({ columnType: 'int' })
  capacity!: number;

  @Property({ fieldName: 'remaining_capacity', columnType: 'int' })
  remainingCapacity!: number;

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
