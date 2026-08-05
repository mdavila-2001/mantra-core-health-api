import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `cashier_payment_contexts`.
 */
@Entity({ schema: 'payments', tableName: 'cashier_payment_contexts' })
export class CashierPaymentContexts {
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
   * Identificador asociado a payment checkout session.
   */
  @Property({ fieldName: 'payment_checkout_session_id', type: 'uuid' }) // FK → payments.payment_checkout_sessions
  paymentCheckoutSessionId!: string;

  /**
   * Identificador asociado a cashier user.
   */
  @Property({ fieldName: 'cashier_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  cashierUserId?: string;

  /**
   * Identificador asociado a cash register.
   */
  @Property({ fieldName: 'cash_register_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  cashRegisterId?: string;

  /**
   * Identificador asociado a site.
   */
  @Property({ fieldName: 'site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  siteId?: string;

  /**
   * Valor de workstation reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'workstation_reference',
    columnType: 'varchar',
    nullable: true,
  })
  workstationReference?: string;

  /**
   * Valor de shift reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'shift_reference',
    columnType: 'varchar',
    nullable: true,
  })
  shiftReference?: string;

  /**
   * Valor de customer display reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'customer_display_reference',
    columnType: 'varchar',
    nullable: true,
  })
  customerDisplayReference?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
