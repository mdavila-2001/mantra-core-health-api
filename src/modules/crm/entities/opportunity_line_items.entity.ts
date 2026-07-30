import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `opportunity_line_items`.
 */
@Entity({ schema: 'crm', tableName: 'opportunity_line_items' })
export class OpportunityLineItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a opportunity.
   */
  @Property({ fieldName: 'opportunity_id', type: 'uuid' }) // FK → crm.opportunities
  opportunityId!: string;

  /**
   * Valor de line number mantenido por la instancia.
   */
  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  /**
   * Identificador asociado a product or service type concept.
   */
  @Property({
    fieldName: 'product_or_service_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  productOrServiceTypeConceptId?: string;

  /**
   * Identificador asociado a product or service ref.
   */
  @Property({
    fieldName: 'product_or_service_ref_id',
    type: 'uuid',
    nullable: true,
  })
  productOrServiceRefId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_price', columnType: 'numeric', nullable: true })
  unitPrice?: string;

  /**
   * Valor de discount percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'discount_percent',
    columnType: 'numeric',
    nullable: true,
  })
  discountPercent?: string;

  /**
   * Valor de total amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a contract line item.
   */
  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

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
