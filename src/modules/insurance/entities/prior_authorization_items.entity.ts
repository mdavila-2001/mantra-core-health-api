import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'prior_authorization_items' })
export class PriorAuthorizationItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'prior_authorization_request_id', type: 'uuid' }) // FK → insurance.prior_authorization_requests
  priorAuthorizationRequestId!: string;

  @Property({ fieldName: 'item_sequence', columnType: 'int' })
  itemSequence!: number;

  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  @Property({
    fieldName: 'diagnostic_study_offering_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_study_offerings
  diagnosticStudyOfferingId?: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacy_products
  pharmacyProductId?: string;

  @Property({
    fieldName: 'requested_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  requestedQuantity?: string;

  @Property({
    fieldName: 'requested_amount',
    columnType: 'numeric',
    nullable: true,
  })
  requestedAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
