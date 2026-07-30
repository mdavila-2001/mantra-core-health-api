import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_debts`.
 */
@Entity({ schema: 'payments', tableName: 'payment_debts' })
export class PaymentDebts {
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
   * Identificador asociado a gateway connection.
   */
  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  /**
   * Identificador asociado a debtor business partner.
   */
  @Property({ fieldName: 'debtor_business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  debtorBusinessPartnerId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a invoice.
   */
  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  /**
   * Valor de internal debt number mantenido por la instancia.
   */
  @Property({ fieldName: 'internal_debt_number', columnType: 'varchar' })
  internalDebtNumber!: string;

  /**
   * Identificador asociado a external debt.
   */
  @Property({
    fieldName: 'external_debt_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalDebtId?: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @Property({ fieldName: 'currency_code', columnType: 'char(3)' })
  currencyCode!: string;

  /**
   * Valor de total amount mantenido por la instancia.
   */
  @Property({ fieldName: 'total_amount', columnType: 'numeric(20,6)' })
  totalAmount!: string;

  /**
   * Valor de outstanding amount mantenido por la instancia.
   */
  @Property({ fieldName: 'outstanding_amount', columnType: 'numeric(20,6)' })
  outstandingAmount!: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de registered at mantenido por la instancia.
   */
  @Property({
    fieldName: 'registered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  registeredAt?: Date;

  /**
   * Valor de settled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'settled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  settledAt?: Date;

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
