import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_accounts' })
export class CrmAccounts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'account_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountTypeConceptId!: string;

  @Property({ fieldName: 'industry_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  industryConceptId?: string;

  @Property({ fieldName: 'parent_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  parentAccountId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  website?: string;

  @Property({ fieldName: 'tax_id', columnType: 'varchar', nullable: true })
  taxId?: string;

  @Property({ fieldName: 'linked_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  linkedTenantId?: string;

  @Property({ fieldName: 'business_partner_id', type: 'uuid', nullable: true }) // FK → erp.business_partners
  businessPartnerId?: string;

  @Property({
    fieldName: 'linked_org_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  linkedOrgRefType?: string;

  @Property({ fieldName: 'linked_org_ref_id', type: 'uuid', nullable: true })
  linkedOrgRefId?: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({
    fieldName: 'annual_value',
    columnType: 'numeric',
    nullable: true,
  })
  annualValue?: string;

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
