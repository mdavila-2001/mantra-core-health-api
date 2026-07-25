import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'business_partner_bank_accounts' })
export class BusinessPartnerBankAccounts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  businessPartnerId!: string;

  @Property({ fieldName: 'bank_name', columnType: 'varchar' })
  bankName!: string;

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

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  @Property({
    fieldName: 'verification_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  verificationStatusConceptId?: string;

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
