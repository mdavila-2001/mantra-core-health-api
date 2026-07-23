import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy', tableName: 'pharmacy_product_prices' })
export class PharmacyProductPrices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_price_list_id', type: 'uuid' }) // FK → pharmacy.pharmacy_price_lists
  pharmacyPriceListId!: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'unit_amount', columnType: 'numeric' })
  unitAmount!: string;

  @Property({ fieldName: 'tax_amount', columnType: 'numeric', nullable: true })
  taxAmount?: string;

  @Property({
    fieldName: 'patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientAmount?: string;

  @Property({
    fieldName: 'insurer_amount',
    columnType: 'numeric',
    nullable: true,
  })
  insurerAmount?: string;

  @Property({
    fieldName: 'minimum_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  minimumQuantity?: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
