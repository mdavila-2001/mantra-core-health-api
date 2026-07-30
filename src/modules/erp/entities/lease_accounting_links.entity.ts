import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lease_accounting_links`.
 */
@Entity({ schema: 'erp', tableName: 'lease_accounting_links' })
export class LeaseAccountingLinks {
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
   * Identificador asociado a lease object.
   */
  @Property({ fieldName: 'lease_object_id', type: 'uuid', nullable: true }) // FK → erp.lease_objects
  leaseObjectId?: string;

  /**
   * Identificador asociado a right of use asset.
   */
  @Property({ fieldName: 'right_of_use_asset_id', type: 'uuid' }) // FK → accounting.assets
  rightOfUseAssetId!: string;

  /**
   * Identificador asociado a lease liability.
   */
  @Property({ fieldName: 'lease_liability_id', type: 'uuid' }) // FK → accounting.liabilities
  leaseLiabilityId!: string;

  /**
   * Identificador asociado a right of use asset account.
   */
  @Property({
    fieldName: 'right_of_use_asset_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  rightOfUseAssetAccountId?: string;

  /**
   * Identificador asociado a lease liability account.
   */
  @Property({
    fieldName: 'lease_liability_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  leaseLiabilityAccountId?: string;

  /**
   * Identificador asociado a interest expense account.
   */
  @Property({
    fieldName: 'interest_expense_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  interestExpenseAccountId?: string;

  /**
   * Identificador asociado a depreciation expense account.
   */
  @Property({
    fieldName: 'depreciation_expense_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  depreciationExpenseAccountId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
