import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'partnerships' })
export class Partnerships {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'partnership_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partnershipTypeConceptId!: string;

  @Property({ fieldName: 'partner_ref_type', columnType: 'varchar' })
  partnerRefType!: string;

  @Property({ fieldName: 'partner_ref_id', type: 'uuid' })
  partnerRefId!: string;

  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  @Property({ fieldName: 'ad_partner_id', type: 'uuid', nullable: true }) // FK → ads.ad_partners
  adPartnerId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  @Property({ fieldName: 'tier_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  tierConceptId?: string;

  @Property({
    fieldName: 'revenue_share_percent',
    columnType: 'numeric',
    nullable: true,
  })
  revenueSharePercent?: string;

  @Property({ fieldName: 'start_date', columnType: 'date', nullable: true })
  startDate?: Date;

  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

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
