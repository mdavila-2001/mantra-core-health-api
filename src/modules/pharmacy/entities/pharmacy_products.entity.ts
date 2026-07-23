import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy', tableName: 'pharmacy_products' })
export class PharmacyProducts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  @Property({ fieldName: 'product_code', columnType: 'varchar' })
  productCode!: string;

  @Property({
    fieldName: 'medication_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  medicationConceptId?: string;

  @Property({
    fieldName: 'inventory_item_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  inventoryItemConceptId?: string;

  @Property({
    fieldName: 'manufacturer_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  manufacturerTenantId?: string;

  @Property({ fieldName: 'brand_name', columnType: 'varchar', nullable: true })
  brandName?: string;

  @Property({
    fieldName: 'generic_name',
    columnType: 'varchar',
    nullable: true,
  })
  genericName?: string;

  @Property({
    fieldName: 'strength_text',
    columnType: 'varchar',
    nullable: true,
  })
  strengthText?: string;

  @Property({
    fieldName: 'dosage_form_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dosageFormConceptId?: string;

  @Property({
    fieldName: 'package_size_text',
    columnType: 'varchar',
    nullable: true,
  })
  packageSizeText?: string;

  @Property({
    fieldName: 'requires_prescription',
    type: 'boolean',
    nullable: true,
  })
  requiresPrescription?: boolean;

  @Property({
    fieldName: 'cold_chain_required',
    type: 'boolean',
    nullable: true,
  })
  coldChainRequired?: boolean;

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
