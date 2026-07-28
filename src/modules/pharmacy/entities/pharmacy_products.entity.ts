import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_products`.
 */
@Entity({ schema: 'pharmacy', tableName: 'pharmacy_products' })
export class PharmacyProducts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy.
   */
  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  /**
   * Valor de product code mantenido por la instancia.
   */
  @Property({ fieldName: 'product_code', columnType: 'varchar' })
  productCode!: string;

  /**
   * Identificador asociado a medication concept.
   */
  @Property({
    fieldName: 'medication_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  medicationConceptId?: string;

  /**
   * Identificador asociado a inventory item concept.
   */
  @Property({
    fieldName: 'inventory_item_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  inventoryItemConceptId?: string;

  /**
   * Identificador asociado a manufacturer tenant.
   */
  @Property({
    fieldName: 'manufacturer_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  manufacturerTenantId?: string;

  /**
   * Valor de brand name mantenido por la instancia.
   */
  @Property({ fieldName: 'brand_name', columnType: 'varchar', nullable: true })
  brandName?: string;

  /**
   * Valor de generic name mantenido por la instancia.
   */
  @Property({
    fieldName: 'generic_name',
    columnType: 'varchar',
    nullable: true,
  })
  genericName?: string;

  /**
   * Valor de strength text mantenido por la instancia.
   */
  @Property({
    fieldName: 'strength_text',
    columnType: 'varchar',
    nullable: true,
  })
  strengthText?: string;

  /**
   * Identificador asociado a dosage form concept.
   */
  @Property({
    fieldName: 'dosage_form_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dosageFormConceptId?: string;

  /**
   * Valor de package size text mantenido por la instancia.
   */
  @Property({
    fieldName: 'package_size_text',
    columnType: 'varchar',
    nullable: true,
  })
  packageSizeText?: string;

  /**
   * Valor de requires prescription mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_prescription',
    type: 'boolean',
    nullable: true,
  })
  requiresPrescription?: boolean;

  /**
   * Valor de cold chain required mantenido por la instancia.
   */
  @Property({
    fieldName: 'cold_chain_required',
    type: 'boolean',
    nullable: true,
  })
  coldChainRequired?: boolean;

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
