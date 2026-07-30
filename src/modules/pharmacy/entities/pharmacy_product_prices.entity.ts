import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_product_prices`.
 */
@Entity({ schema: 'pharmacy', tableName: 'pharmacy_product_prices' })
export class PharmacyProductPrices {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy price list.
   */
  @Property({ fieldName: 'pharmacy_price_list_id', type: 'uuid' }) // FK → pharmacy.pharmacy_price_lists
  pharmacyPriceListId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Valor de unit amount mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_amount', columnType: 'numeric' })
  unitAmount!: string;

  /**
   * Valor de tax amount mantenido por la instancia.
   */
  @Property({ fieldName: 'tax_amount', columnType: 'numeric', nullable: true })
  taxAmount?: string;

  /**
   * Valor de patient amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientAmount?: string;

  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'insurer_amount',
    columnType: 'numeric',
    nullable: true,
  })
  insurerAmount?: string;

  /**
   * Valor de minimum quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'minimum_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  minimumQuantity?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
