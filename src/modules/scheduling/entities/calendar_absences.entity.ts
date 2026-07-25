import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'scheduling', tableName: 'calendar_absences' })
export class CalendarAbsences {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  @Property({ fieldName: 'subject_ref_id', type: 'uuid' })
  subjectRefId!: string;

  @Property({ fieldName: 'person_id', type: 'uuid', nullable: true }) // FK → profiles.persons
  personId?: string;

  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  @Property({ fieldName: 'resource_id', type: 'uuid', nullable: true }) // FK → scheduling.schedulable_resources
  resourceId?: string;

  @Property({ fieldName: 'absence_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  absenceTypeConceptId!: string;

  @Property({ fieldName: 'start_at', columnType: 'timestamptz' })
  startAt!: Date;

  @Property({ fieldName: 'end_at', columnType: 'timestamptz' })
  endAt!: Date;

  @Property({ fieldName: 'all_day', type: 'boolean', nullable: true })
  allDay?: boolean;

  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  @Property({ fieldName: 'approval_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approvalStatusConceptId!: string;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

  @Property({ fieldName: 'time_off_request_id', type: 'uuid', nullable: true }) // FK → erp.time_off_requests
  timeOffRequestId?: string;

  @Property({ fieldName: 'blocks_scheduling', type: 'boolean', nullable: true })
  blocksScheduling?: boolean;

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
