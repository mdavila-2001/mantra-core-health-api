import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `sales`.
 */
@Entity({ schema: 'accounting', tableName: 'sales' })
export class Sales {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a transaction.
   */
  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK → accounting.journal_transactions
  transactionId?: string;

  /**
   * Identificador asociado a customer type concept.
   */
  @Property({
    fieldName: 'customer_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  customerTypeConceptId?: string;

  /**
   * Identificador asociado a customer.
   */
  @Property({ fieldName: 'customer_id', type: 'uuid', nullable: true })
  customerId?: string;

  /**
   * Identificador asociado a invoice.
   */
  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  /**
   * Valor de sale date mantenido por la instancia.
   */
  @Property({ fieldName: 'sale_date', columnType: 'date' })
  saleDate!: Date;

  /**
   * Valor de subtotal mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  subtotal?: string;

  /**
   * Valor de tax total mantenido por la instancia.
   */
  @Property({ fieldName: 'tax_total', columnType: 'numeric', nullable: true })
  taxTotal?: string;

  /**
   * Valor de total mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  total?: string;

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
