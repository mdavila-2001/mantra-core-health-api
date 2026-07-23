import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'asset_postings' })
export class AssetPostings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'asset_id', type: 'uuid' }) // FK → accounting.assets
  assetId!: string;

  @Property({ fieldName: 'asset_component_id', type: 'uuid', nullable: true }) // FK → accounting.asset_components
  assetComponentId?: string;

  @Property({ fieldName: 'ledger_entry_id', type: 'uuid' }) // FK → accounting.ledger_entries
  ledgerEntryId!: string;

  @Property({ fieldName: 'transaction_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transactionTypeConceptId!: string;

  @Property({
    fieldName: 'asset_value_date',
    columnType: 'date',
    nullable: true,
  })
  assetValueDate?: Date;

  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
