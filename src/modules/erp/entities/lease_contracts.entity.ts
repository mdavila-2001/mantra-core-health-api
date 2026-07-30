import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lease_contracts`.
 */
@Entity({ schema: 'erp', tableName: 'lease_contracts' })
export class LeaseContracts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  /**
   * Identificador asociado a lease role concept.
   */
  @Property({ fieldName: 'lease_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  leaseRoleConceptId!: string;

  /**
   * Valor de commencement date mantenido por la instancia.
   */
  @Property({ fieldName: 'commencement_date', columnType: 'date' })
  commencementDate!: Date;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  /**
   * Valor de discount rate mantenido por la instancia.
   */
  @Property({
    fieldName: 'discount_rate',
    columnType: 'numeric',
    nullable: true,
  })
  discountRate?: string;

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
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de short term exemption mantenido por la instancia.
   */
  @Property({
    fieldName: 'short_term_exemption',
    type: 'boolean',
    nullable: true,
  })
  shortTermExemption?: boolean;

  /**
   * Valor de low value exemption mantenido por la instancia.
   */
  @Property({
    fieldName: 'low_value_exemption',
    type: 'boolean',
    nullable: true,
  })
  lowValueExemption?: boolean;

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
