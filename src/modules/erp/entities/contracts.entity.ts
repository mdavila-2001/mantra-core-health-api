import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contracts`.
 */
@Entity({ schema: 'erp', tableName: 'contracts' })
export class Contracts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de contract number mantenido por la instancia.
   */
  @Property({ fieldName: 'contract_number', columnType: 'varchar' })
  contractNumber!: string;

  /**
   * Identificador asociado a contract type concept.
   */
  @Property({ fieldName: 'contract_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contractTypeConceptId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a counterparty type concept.
   */
  @Property({ fieldName: 'counterparty_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  counterpartyTypeConceptId!: string;

  /**
   * Valor de counterparty ref type mantenido por la instancia.
   */
  @Property({
    fieldName: 'counterparty_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  counterpartyRefType?: string;

  /**
   * Identificador asociado a counterparty ref.
   */
  @Property({ fieldName: 'counterparty_ref_id', type: 'uuid', nullable: true })
  counterpartyRefId?: string;

  /**
   * Valor de counterparty name mantenido por la instancia.
   */
  @Property({
    fieldName: 'counterparty_name',
    columnType: 'varchar',
    nullable: true,
  })
  counterpartyName?: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @Property({ fieldName: 'start_date', columnType: 'date' })
  startDate!: Date;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  /**
   * Identificador asociado a renewal type concept.
   */
  @Property({
    fieldName: 'renewal_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  renewalTypeConceptId?: string;

  /**
   * Valor de notice period days mantenido por la instancia.
   */
  @Property({
    fieldName: 'notice_period_days',
    columnType: 'int',
    nullable: true,
  })
  noticePeriodDays?: number;

  /**
   * Valor de total value mantenido por la instancia.
   */
  @Property({ fieldName: 'total_value', columnType: 'numeric', nullable: true })
  totalValue?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a governing jurisdiction concept.
   */
  @Property({
    fieldName: 'governing_jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  governingJurisdictionConceptId?: string;

  /**
   * Identificador asociado a owner user.
   */
  @Property({ fieldName: 'owner_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  ownerUserId?: string;

  /**
   * Identificador asociado a primary business partner.
   */
  @Property({
    fieldName: 'primary_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  primaryBusinessPartnerId?: string;

  /**
   * Identificador asociado a current version.
   */
  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK → erp.contract_versions
  currentVersionId?: string;

  /**
   * Identificador asociado a parent contract.
   */
  @Property({ fieldName: 'parent_contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  parentContractId?: string;

  /**
   * Identificador asociado a master agreement.
   */
  @Property({ fieldName: 'master_agreement_id', type: 'uuid', nullable: true }) // FK → crm.partnership_agreements
  masterAgreementId?: string;

  /**
   * Identificador asociado a owning department.
   */
  @Property({ fieldName: 'owning_department_id', type: 'uuid', nullable: true }) // FK → erp.departments
  owningDepartmentId?: string;

  /**
   * Identificador asociado a owning cost center.
   */
  @Property({
    fieldName: 'owning_cost_center_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.cost_centers
  owningCostCenterId?: string;

  /**
   * Identificador asociado a owning profit center.
   */
  @Property({
    fieldName: 'owning_profit_center_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.profit_centers
  owningProfitCenterId?: string;

  /**
   * Identificador asociado a approval status concept.
   */
  @Property({
    fieldName: 'approval_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  approvalStatusConceptId?: string;

  /**
   * Identificador asociado a signature status concept.
   */
  @Property({
    fieldName: 'signature_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  signatureStatusConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
