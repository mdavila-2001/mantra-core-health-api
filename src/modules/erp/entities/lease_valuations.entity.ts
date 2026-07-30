import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lease_valuations`.
 */
@Entity({ schema: 'erp', tableName: 'lease_valuations' })
export class LeaseValuations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a lease contract.
   */
  @Property({ fieldName: 'lease_contract_id', type: 'uuid' }) // FK → erp.lease_contracts
  leaseContractId!: string;

  /**
   * Valor de valuation date mantenido por la instancia.
   */
  @Property({ fieldName: 'valuation_date', columnType: 'date' })
  valuationDate!: Date;

  /**
   * Identificador asociado a accounting principle concept.
   */
  @Property({
    fieldName: 'accounting_principle_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  accountingPrincipleConceptId?: string;

  /**
   * Valor de right of use asset value mantenido por la instancia.
   */
  @Property({
    fieldName: 'right_of_use_asset_value',
    columnType: 'numeric',
    nullable: true,
  })
  rightOfUseAssetValue?: string;

  /**
   * Valor de lease liability value mantenido por la instancia.
   */
  @Property({
    fieldName: 'lease_liability_value',
    columnType: 'numeric',
    nullable: true,
  })
  leaseLiabilityValue?: string;

  /**
   * Valor de interest expense mantenido por la instancia.
   */
  @Property({
    fieldName: 'interest_expense',
    columnType: 'numeric',
    nullable: true,
  })
  interestExpense?: string;

  /**
   * Valor de depreciation expense mantenido por la instancia.
   */
  @Property({
    fieldName: 'depreciation_expense',
    columnType: 'numeric',
    nullable: true,
  })
  depreciationExpense?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a journal transaction.
   */
  @Property({
    fieldName: 'journal_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.journal_transactions
  journalTransactionId?: string;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
