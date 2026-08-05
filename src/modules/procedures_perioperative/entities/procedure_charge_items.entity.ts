import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_charge_items`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_charge_items',
})
export class ProcedureChargeItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  /**
   * Identificador asociado a procedure.
   */
  @Property({ fieldName: 'procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  procedureId?: string;

  /**
   * Identificador asociado a charge item type concept.
   */
  @Property({ fieldName: 'charge_item_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  chargeItemTypeConceptId!: string;

  /**
   * Identificador asociado a billable item.
   */
  @Property({ fieldName: 'billable_item_id', type: 'uuid' }) // FK → billing.service_catalog
  billableItemId!: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(20,6)', nullable: true })
  quantity?: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @Property({
    fieldName: 'unit_price',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  unitPrice?: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  /**
   * Identificador asociado a billing claim line.
   */
  @Property({
    fieldName: 'billing_claim_line_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.insurance_claim_lines
  billingClaimLineId?: string;

  /**
   * Identificador asociado a invoice line.
   */
  @Property({ fieldName: 'invoice_line_id', type: 'uuid', nullable: true }) // FK → billing.invoice_lines
  invoiceLineId?: string;

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
