import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_charge_items',
})
export class ProcedureChargeItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  procedureId?: string;

  @Property({ fieldName: 'charge_item_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  chargeItemTypeConceptId!: string;

  @Property({ fieldName: 'billable_item_id', type: 'uuid' }) // FK (destino no resuelto)
  billableItemId!: string;

  @Property({ columnType: 'numeric(20,6)', nullable: true })
  quantity?: string;

  @Property({
    fieldName: 'unit_price',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  unitPrice?: string;

  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  @Property({
    fieldName: 'billing_claim_line_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  billingClaimLineId?: string;

  @Property({ fieldName: 'invoice_line_id', type: 'uuid', nullable: true }) // FK → billing.invoice_lines
  invoiceLineId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
