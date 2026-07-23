import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'leads' })
export class Leads {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'lead_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  leadSourceConceptId!: string;

  @Property({ fieldName: 'contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  contactId?: string;

  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  @Property({ fieldName: 'full_name', columnType: 'varchar', nullable: true })
  fullName?: string;

  @Property({ columnType: 'varchar', nullable: true })
  email?: string;

  @Property({ columnType: 'varchar', nullable: true })
  phone?: string;

  @Property({
    fieldName: 'interest_text',
    columnType: 'varchar',
    nullable: true,
  })
  interestText?: string;

  @Property({ fieldName: 'lead_score', columnType: 'numeric', nullable: true })
  leadScore?: string;

  @Property({ fieldName: 'lead_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  leadStatusConceptId!: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({ fieldName: 'campaign_ref_id', type: 'uuid', nullable: true })
  campaignRefId?: string;

  @Property({
    fieldName: 'converted_opportunity_id',
    type: 'uuid',
    nullable: true,
  }) // FK → crm.opportunities
  convertedOpportunityId?: string;

  @Property({
    fieldName: 'converted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  convertedAt?: Date;

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
