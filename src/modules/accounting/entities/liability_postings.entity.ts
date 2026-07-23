import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'liability_postings' })
export class LiabilityPostings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'liability_id', type: 'uuid' }) // FK → accounting.liabilities
  liabilityId!: string;

  @Property({
    fieldName: 'liability_schedule_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.liability_schedules
  liabilityScheduleId?: string;

  @Property({ fieldName: 'ledger_entry_id', type: 'uuid' }) // FK → accounting.ledger_entries
  ledgerEntryId!: string;

  @Property({ fieldName: 'component_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  componentConceptId!: string;

  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'effective_date', columnType: 'date', nullable: true })
  effectiveDate?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
