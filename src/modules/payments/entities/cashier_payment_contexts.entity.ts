import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'cashier_payment_contexts' })
export class CashierPaymentContexts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'payment_checkout_session_id', type: 'uuid' }) // FK → payments.payment_checkout_sessions
  paymentCheckoutSessionId!: string;

  @Property({ fieldName: 'cashier_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  cashierUserId?: string;

  @Property({ fieldName: 'cash_register_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  cashRegisterId?: string;

  @Property({ fieldName: 'site_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  siteId?: string;

  @Property({
    fieldName: 'workstation_reference',
    columnType: 'varchar',
    nullable: true,
  })
  workstationReference?: string;

  @Property({
    fieldName: 'shift_reference',
    columnType: 'varchar',
    nullable: true,
  })
  shiftReference?: string;

  @Property({
    fieldName: 'customer_display_reference',
    columnType: 'varchar',
    nullable: true,
  })
  customerDisplayReference?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
