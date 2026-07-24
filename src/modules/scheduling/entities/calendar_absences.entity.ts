import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'calendar_absences' })
export class CalendarAbsences {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true })
  practiceId?: string;

  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' })
  subjectTypeConceptId!: string;

  @Property({ fieldName: 'subject_ref_id', type: 'uuid' })
  subjectRefId!: string;

  @Property({ fieldName: 'person_id', type: 'uuid', nullable: true })
  personId?: string;

  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Property({ fieldName: 'resource_id', type: 'uuid', nullable: true })
  resourceId?: string;

  @Property({ fieldName: 'absence_type_concept_id', type: 'uuid' })
  absenceTypeConceptId!: string;

  @Property({ fieldName: 'start_at', columnType: 'timestamptz' })
  startAt!: Date;

  @Property({ fieldName: 'end_at', columnType: 'timestamptz' })
  endAt!: Date;

  @Property({ fieldName: 'all_day', type: 'boolean', nullable: true })
  allDay?: boolean;

  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  @Property({ fieldName: 'approval_status_concept_id', type: 'uuid' })
  approvalStatusConceptId!: string;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId?: string;

  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  @Property({ fieldName: 'time_off_request_id', type: 'uuid', nullable: true })
  timeOffRequestId?: string;

  @Property({ fieldName: 'blocks_scheduling', type: 'boolean', nullable: true })
  blocksScheduling?: boolean;

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
