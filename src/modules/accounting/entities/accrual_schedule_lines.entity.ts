import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'accrual_schedule_lines' })
export class AccrualScheduleLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'accrual_object_id', type: 'uuid' }) // FK → accounting.accrual_objects
  accrualObjectId!: string;

  @Property({ fieldName: 'fiscal_period_id', type: 'uuid' }) // FK → accounting.fiscal_periods
  fiscalPeriodId!: string;

  @Property({
    fieldName: 'planned_amount',
    columnType: 'numeric',
    nullable: true,
  })
  plannedAmount?: string;

  @Property({
    fieldName: 'posted_amount',
    columnType: 'numeric',
    nullable: true,
  })
  postedAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
