import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'liability_schedules' })
export class LiabilitySchedules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'liability_id', type: 'uuid' }) // FK → accounting.liabilities
  liabilityId!: string;

  @Property({ fieldName: 'installment_number', columnType: 'int' })
  installmentNumber!: number;

  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  @Property({
    fieldName: 'principal_due',
    columnType: 'numeric',
    nullable: true,
  })
  principalDue?: string;

  @Property({
    fieldName: 'interest_due',
    columnType: 'numeric',
    nullable: true,
  })
  interestDue?: string;

  @Property({ fieldName: 'fee_due', columnType: 'numeric', nullable: true })
  feeDue?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'paid_amount', columnType: 'numeric', nullable: true })
  paidAmount?: string;

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
