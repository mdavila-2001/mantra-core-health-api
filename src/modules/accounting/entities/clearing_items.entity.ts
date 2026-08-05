import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `clearing_items`.
 */
@Entity({ schema: 'accounting', tableName: 'clearing_items' })
export class ClearingItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a clearing document.
   */
  @Property({ fieldName: 'clearing_document_id', type: 'uuid' }) // FK → accounting.clearing_documents
  clearingDocumentId!: string;

  /**
   * Identificador asociado a open item.
   */
  @Property({ fieldName: 'open_item_id', type: 'uuid' }) // FK → accounting.open_items
  openItemId!: string;

  /**
   * Valor de cleared amount mantenido por la instancia.
   */
  @Property({ fieldName: 'cleared_amount', columnType: 'numeric' })
  clearedAmount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a residual open item.
   */
  @Property({
    fieldName: 'residual_open_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.open_items
  residualOpenItemId?: string;

  /**
   * Valor de discount amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'discount_amount',
    columnType: 'numeric',
    nullable: true,
  })
  discountAmount?: string;

  /**
   * Valor de exchange difference amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'exchange_difference_amount',
    columnType: 'numeric',
    nullable: true,
  })
  exchangeDifferenceAmount?: string;

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
