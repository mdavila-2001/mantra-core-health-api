import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'company_bank_accounts' })
export class CompanyBankAccounts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'account_id', type: 'uuid' }) // FK → accounting.accounts
  accountId!: string;

  @Property({ fieldName: 'bank_name', columnType: 'varchar' })
  bankName!: string;

  // Titular de la cuenta: el modelo oficial lo declara para poder validar que el
  // beneficiario del pago coincide con la razón social de la empresa (control
  // antifraude en tesorería). Ausente en la BD introspectada de 2026-07-21.
  @Property({
    fieldName: 'account_holder_name',
    columnType: 'varchar',
    nullable: true,
  })
  accountHolderName?: string;

  @Property({
    fieldName: 'account_holder_tax_id',
    columnType: 'varchar',
    nullable: true,
  })
  accountHolderTaxId?: string;

  @Property({
    fieldName: 'bank_identifier_code',
    columnType: 'varchar',
    nullable: true,
  })
  bankIdentifierCode?: string;

  @Property({ fieldName: 'iban_masked', columnType: 'varchar', nullable: true })
  ibanMasked?: string;

  @Property({
    fieldName: 'account_number_hash',
    columnType: 'varchar',
    nullable: true,
  })
  accountNumberHash?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

  @Property({ fieldName: 'clearing_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  clearingAccountId?: string;

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
