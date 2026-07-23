import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'journal_transactions' })
export class JournalTransactions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'transaction_number', columnType: 'varchar' })
  transactionNumber!: string;

  @Property({ fieldName: 'transaction_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transactionTypeConceptId!: string;

  @Property({ fieldName: 'transaction_date', columnType: 'date' })
  transactionDate!: Date;

  @Property({ fieldName: 'fiscal_period_id', type: 'uuid', nullable: true }) // FK → accounting.fiscal_periods
  fiscalPeriodId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({ columnType: 'varchar', nullable: true })
  reference?: string;

  @Property({
    fieldName: 'source_document_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceDocumentType?: string;

  @Property({ fieldName: 'source_document_id', type: 'uuid', nullable: true })
  sourceDocumentId?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'total_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalAmount?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'posted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  postedAt?: Date;

  @Property({ fieldName: 'posted_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  postedByUserId?: string;

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
