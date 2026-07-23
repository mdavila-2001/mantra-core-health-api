import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contracts' })
export class Contracts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'contract_number', columnType: 'varchar' })
  contractNumber!: string;

  @Property({ fieldName: 'contract_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contractTypeConceptId!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'counterparty_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  counterpartyTypeConceptId!: string;

  @Property({
    fieldName: 'counterparty_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  counterpartyRefType?: string;

  @Property({ fieldName: 'counterparty_ref_id', type: 'uuid', nullable: true })
  counterpartyRefId?: string;

  @Property({
    fieldName: 'counterparty_name',
    columnType: 'varchar',
    nullable: true,
  })
  counterpartyName?: string;

  @Property({ fieldName: 'start_date', columnType: 'date' })
  startDate!: Date;

  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  @Property({
    fieldName: 'renewal_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  renewalTypeConceptId?: string;

  @Property({
    fieldName: 'notice_period_days',
    columnType: 'int',
    nullable: true,
  })
  noticePeriodDays?: number;

  @Property({ fieldName: 'total_value', columnType: 'numeric', nullable: true })
  totalValue?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'governing_jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  governingJurisdictionConceptId?: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  @Property({
    fieldName: 'primary_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  primaryBusinessPartnerId?: string;

  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  currentVersionId?: string;

  @Property({ fieldName: 'parent_contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  parentContractId?: string;

  @Property({ fieldName: 'master_agreement_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  masterAgreementId?: string;

  @Property({ fieldName: 'owning_department_id', type: 'uuid', nullable: true }) // FK → erp.departments
  owningDepartmentId?: string;

  @Property({
    fieldName: 'owning_cost_center_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.cost_centers
  owningCostCenterId?: string;

  @Property({
    fieldName: 'owning_profit_center_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.profit_centers
  owningProfitCenterId?: string;

  @Property({
    fieldName: 'approval_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  approvalStatusConceptId?: string;

  @Property({
    fieldName: 'signature_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  signatureStatusConceptId?: string;

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
