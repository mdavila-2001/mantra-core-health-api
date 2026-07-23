import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'clearing_items' })
export class ClearingItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'clearing_document_id', type: 'uuid' }) // FK → accounting.clearing_documents
  clearingDocumentId!: string;

  @Property({ fieldName: 'open_item_id', type: 'uuid' }) // FK → accounting.open_items
  openItemId!: string;

  @Property({ fieldName: 'cleared_amount', columnType: 'numeric' })
  clearedAmount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'residual_open_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.open_items
  residualOpenItemId?: string;

  @Property({
    fieldName: 'discount_amount',
    columnType: 'numeric',
    nullable: true,
  })
  discountAmount?: string;

  @Property({
    fieldName: 'exchange_difference_amount',
    columnType: 'numeric',
    nullable: true,
  })
  exchangeDifferenceAmount?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
