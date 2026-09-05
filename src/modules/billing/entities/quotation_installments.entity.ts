import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `quotation_installments`. Cada fila
 * es una cuota congelada del plan de pagos simulado al crear la cotización
 * (FT-24): no se recalcula si cambian la tasa o el catálogo más adelante.
 */
@Entity({ schema: 'billing', tableName: 'quotation_installments' })
export class QuotationInstallments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Cotización dueña de la cuota.
   */
  @Property({ fieldName: 'quotation_id', type: 'uuid' }) // FK → billing.quotations
  quotationId!: string;

  /**
   * Número de orden de la cuota dentro del plan (1-based).
   */
  @Property({ fieldName: 'installment_number', columnType: 'int' })
  installmentNumber!: number;

  /**
   * Fecha de vencimiento de la cuota.
   */
  @Property({ fieldName: 'due_date', columnType: 'date' })
  dueDate!: Date;

  /**
   * Porción de capital de la cuota.
   */
  @Property({ fieldName: 'principal_amount', columnType: 'numeric' })
  principalAmount!: string;

  /**
   * Porción de interés de la cuota.
   */
  @Property({ fieldName: 'interest_amount', columnType: 'numeric' })
  interestAmount!: string;

  /**
   * Importe total de la cuota (capital + interés).
   */
  @Property({ fieldName: 'total_amount', columnType: 'numeric' })
  totalAmount!: string;

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
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
