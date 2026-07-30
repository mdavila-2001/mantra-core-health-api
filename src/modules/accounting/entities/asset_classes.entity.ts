import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `asset_classes`.
 */
@Entity({ schema: 'accounting', tableName: 'asset_classes' })
export class AssetClasses {
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
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a asset type concept.
   */
  @Property({
    fieldName: 'asset_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assetTypeConceptId?: string;

  /**
   * Identificador asociado a acquisition account.
   */
  @Property({
    fieldName: 'acquisition_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  acquisitionAccountId?: string;

  /**
   * Identificador asociado a accumulated depreciation account.
   */
  @Property({
    fieldName: 'accumulated_depreciation_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  accumulatedDepreciationAccountId?: string;

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
   * Identificador asociado a gain account.
   */
  @Property({ fieldName: 'gain_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  gainAccountId?: string;

  /**
   * Identificador asociado a loss account.
   */
  @Property({ fieldName: 'loss_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  lossAccountId?: string;

  /**
   * Valor de default useful life months mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_useful_life_months',
    columnType: 'int',
    nullable: true,
  })
  defaultUsefulLifeMonths?: number;

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
