import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'time_off_requests' })
export class TimeOffRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'employee_id', type: 'uuid' }) // FK → erp.employees
  employeeId!: string;

  @Property({ fieldName: 'leave_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  leaveTypeConceptId!: string;

  @Property({ fieldName: 'start_date', columnType: 'date' })
  startDate!: Date;

  @Property({ fieldName: 'end_date', columnType: 'date' })
  endDate!: Date;

  @Property({ columnType: 'numeric', nullable: true })
  hours?: string;

  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  @Property({ fieldName: 'approver_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approverUserId?: string;

  @Property({
    fieldName: 'approved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  approvedAt?: Date;

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
