import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `account_determination_rules`.
 */
@Entity({ schema: 'accounting', tableName: 'account_determination_rules' })
export class AccountDeterminationRules {
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
   * Identificador asociado a posting scenario concept.
   */
  @Property({ fieldName: 'posting_scenario_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  postingScenarioConceptId!: string;

  /**
   * Identificador asociado a account role concept.
   */
  @Property({ fieldName: 'account_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountRoleConceptId!: string;

  /**
   * Identificador asociado a source type concept.
   */
  @Property({
    fieldName: 'source_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sourceTypeConceptId?: string;

  /**
   * Identificador asociado a asset class.
   */
  @Property({ fieldName: 'asset_class_id', type: 'uuid', nullable: true }) // FK → accounting.asset_classes
  assetClassId?: string;

  /**
   * Identificador asociado a liability type concept.
   */
  @Property({
    fieldName: 'liability_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  liabilityTypeConceptId?: string;

  /**
   * Identificador asociado a contract type concept.
   */
  @Property({
    fieldName: 'contract_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  contractTypeConceptId?: string;

  /**
   * Identificador asociado a tax code.
   */
  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  /**
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  /**
   * Identificador asociado a target account.
   */
  @Property({ fieldName: 'target_account_id', type: 'uuid' }) // FK → accounting.accounts
  targetAccountId!: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  priority?: number;

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
