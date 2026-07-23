import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'wallets' })
export class Wallets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'owner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ownerTypeConceptId!: string;

  @Property({ fieldName: 'owner_ref_id', type: 'uuid' })
  ownerRefId!: string;

  @Property({ fieldName: 'wallet_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  walletTypeConceptId!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({
    fieldName: 'available_balance',
    columnType: 'numeric',
    nullable: true,
  })
  availableBalance?: string;

  @Property({
    fieldName: 'pending_balance',
    columnType: 'numeric',
    nullable: true,
  })
  pendingBalance?: string;

  @Property({
    fieldName: 'reserved_balance',
    columnType: 'numeric',
    nullable: true,
  })
  reservedBalance?: string;

  @Property({ fieldName: 'ledger_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  ledgerAccountId?: string;

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
