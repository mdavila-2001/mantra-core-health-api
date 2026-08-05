import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `subledger_accounts`.
 */
@Entity({ schema: 'accounting', tableName: 'subledger_accounts' })
export class SubledgerAccounts {
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
   * Identificador asociado a business partner.
   */
  @Property({ fieldName: 'business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  businessPartnerId!: string;

  /**
   * Identificador asociado a subledger role concept.
   */
  @Property({ fieldName: 'subledger_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subledgerRoleConceptId!: string;

  /**
   * Identificador asociado a reconciliation account.
   */
  @Property({ fieldName: 'reconciliation_account_id', type: 'uuid' }) // FK → accounting.accounts
  reconciliationAccountId!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a payment terms concept.
   */
  @Property({
    fieldName: 'payment_terms_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  paymentTermsConceptId?: string;

  /**
   * Identificador asociado a dunning procedure concept.
   */
  @Property({
    fieldName: 'dunning_procedure_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dunningProcedureConceptId?: string;

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
