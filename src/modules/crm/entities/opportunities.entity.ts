import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'opportunities' })
export class Opportunities {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'pipeline_id', type: 'uuid' }) // FK → crm.pipelines
  pipelineId!: string;

  @Property({ fieldName: 'stage_id', type: 'uuid' }) // FK → crm.pipeline_stages
  stageId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'crm_account_id', type: 'uuid', nullable: true }) // FK → crm.crm_accounts
  crmAccountId?: string;

  @Property({ fieldName: 'primary_contact_id', type: 'uuid', nullable: true }) // FK → crm.contacts
  primaryContactId?: string;

  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'expected_close_date',
    columnType: 'date',
    nullable: true,
  })
  expectedCloseDate?: Date;

  @Property({
    fieldName: 'probability_percent',
    columnType: 'numeric',
    nullable: true,
  })
  probabilityPercent?: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  @Property({ fieldName: 'sales_order_id', type: 'uuid', nullable: true }) // FK → erp.sales_orders
  salesOrderId?: string;

  @Property({
    fieldName: 'lost_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lostReasonConceptId?: string;

  @Property({ fieldName: 'won_at', columnType: 'timestamptz', nullable: true })
  wonAt?: Date;

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
