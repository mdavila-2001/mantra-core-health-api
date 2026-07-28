import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `invoice_match_runs`.
 */
@Entity({ schema: 'erp', tableName: 'invoice_match_runs' })
export class InvoiceMatchRuns {
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
   * Identificador asociado a bill.
   */
  @Property({ fieldName: 'bill_id', type: 'uuid' }) // FK → billing.bills
  billId!: string;

  /**
   * Identificador asociado a match type concept.
   */
  @Property({ fieldName: 'match_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  matchTypeConceptId!: string;

  /**
   * Identificador asociado a purchase order.
   */
  @Property({ fieldName: 'purchase_order_id', type: 'uuid', nullable: true }) // FK → erp.purchase_orders
  purchaseOrderId?: string;

  /**
   * Valor de run at mantenido por la instancia.
   */
  @Property({ fieldName: 'run_at', columnType: 'timestamptz', nullable: true })
  runAt?: Date;

  /**
   * Valor de matched amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'matched_amount',
    columnType: 'numeric',
    nullable: true,
  })
  matchedAmount?: string;

  /**
   * Valor de variance amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'variance_amount',
    columnType: 'numeric',
    nullable: true,
  })
  varianceAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  resultConceptId?: string;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
