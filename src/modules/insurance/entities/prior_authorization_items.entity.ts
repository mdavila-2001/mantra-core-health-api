import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `prior_authorization_items`.
 */
@Entity({ schema: 'insurance', tableName: 'prior_authorization_items' })
export class PriorAuthorizationItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a prior authorization request.
   */
  @Property({ fieldName: 'prior_authorization_request_id', type: 'uuid' }) // FK → insurance.prior_authorization_requests
  priorAuthorizationRequestId!: string;

  /**
   * Valor de item sequence mantenido por la instancia.
   */
  @Property({ fieldName: 'item_sequence', columnType: 'int' })
  itemSequence!: number;

  /**
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  /**
   * Identificador asociado a diagnostic study offering.
   */
  @Property({
    fieldName: 'diagnostic_study_offering_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_study_offerings
  diagnosticStudyOfferingId?: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacy_products
  pharmacyProductId?: string;

  /**
   * Valor de requested quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'requested_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  requestedQuantity?: string;

  /**
   * Valor de requested amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'requested_amount',
    columnType: 'numeric',
    nullable: true,
  })
  requestedAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
