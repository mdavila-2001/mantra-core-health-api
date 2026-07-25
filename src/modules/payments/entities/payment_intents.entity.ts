import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_intents' })
export class PaymentIntents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  @Property({
    fieldName: 'gateway_connection_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.gateway_connections
  gatewayConnectionId?: string;

  @Property({ fieldName: 'payment_method_id', type: 'uuid', nullable: true }) // FK → payments.payment_methods
  paymentMethodId?: string;

  @Property({ fieldName: 'purpose_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeConceptId!: string;

  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  @Property({
    fieldName: 'source_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceRefType?: string;

  @Property({ fieldName: 'source_ref_id', type: 'uuid', nullable: true })
  sourceRefId?: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({
    fieldName: 'gateway_intent_ref',
    columnType: 'varchar',
    nullable: true,
  })
  gatewayIntentRef?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'client_secret_ref',
    columnType: 'varchar',
    nullable: true,
  })
  clientSecretRef?: string;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

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
