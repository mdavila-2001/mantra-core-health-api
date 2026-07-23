import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'accrual_postings' })
export class AccrualPostings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'accrual_schedule_line_id', type: 'uuid' }) // FK → accounting.accrual_schedule_lines
  accrualScheduleLineId!: string;

  @Property({ fieldName: 'ledger_entry_id', type: 'uuid' }) // FK → accounting.ledger_entries
  ledgerEntryId!: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'posting_date', columnType: 'date', nullable: true })
  postingDate?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
