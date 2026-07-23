import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'ledger_entries' })
export class LedgerEntries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'transaction_id', type: 'uuid' }) // FK (destino no resuelto)
  transactionId!: string;

  @Property({ fieldName: 'account_id', type: 'uuid' }) // FK → accounting.accounts
  accountId!: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'fx_rate', columnType: 'numeric', nullable: true })
  fxRate?: string;

  @Property({ fieldName: 'amount_base', columnType: 'numeric', nullable: true })
  amountBase?: string;

  @Property({ fieldName: 'line_no', columnType: 'int' })
  lineNo!: number;

  @Property({ columnType: 'varchar', nullable: true })
  memo?: string;

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
