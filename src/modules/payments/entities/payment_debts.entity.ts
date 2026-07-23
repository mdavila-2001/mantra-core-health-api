import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_debts' })
export class PaymentDebts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  @Property({ fieldName: 'debtor_business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  debtorBusinessPartnerId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts (inferida)
  contractId?: string;

  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  @Property({ fieldName: 'internal_debt_number', columnType: 'varchar' })
  internalDebtNumber!: string;

  @Property({
    fieldName: 'external_debt_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalDebtId?: string;

  @Property({ fieldName: 'currency_code', columnType: 'char(3)' })
  currencyCode!: string;

  @Property({ fieldName: 'total_amount', columnType: 'numeric(20,6)' })
  totalAmount!: string;

  @Property({ fieldName: 'outstanding_amount', columnType: 'numeric(20,6)' })
  outstandingAmount!: string;

  @Property({ fieldName: 'due_at', columnType: 'timestamptz' })
  dueAt!: Date;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'registered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  registeredAt?: Date;

  @Property({
    fieldName: 'settled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  settledAt?: Date;

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
