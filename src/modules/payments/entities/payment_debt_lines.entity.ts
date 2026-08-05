import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_debt_lines`.
 */
@Entity({ schema: 'payments', tableName: 'payment_debt_lines' })
export class PaymentDebtLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a payment debt.
   */
  @Property({ fieldName: 'payment_debt_id', type: 'uuid' }) // FK → payments.payment_debts
  paymentDebtId!: string;

  /**
   * Valor de line number mantenido por la instancia.
   */
  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  /**
   * Identificador asociado a billable item type concept.
   */
  @Property({
    fieldName: 'billable_item_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  billableItemTypeConceptId?: string;

  /**
   * Identificador asociado a billable item.
   */
  @Property({ fieldName: 'billable_item_id', type: 'uuid', nullable: true })
  billableItemId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  description!: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(20,6)' })
  quantity!: string;

  /**
   * Valor de unit amount mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_amount', columnType: 'numeric(20,6)' })
  unitAmount!: string;

  /**
   * Valor de line amount mantenido por la instancia.
   */
  @Property({ fieldName: 'line_amount', columnType: 'numeric(20,6)' })
  lineAmount!: string;

  /**
   * Valor de tax amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'tax_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  taxAmount?: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'discount_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  discountAmount?: string;

  /**
   * Identificador asociado a accounting account.
   */
  @Property({
    fieldName: 'accounting_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  accountingAccountId?: string;

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
