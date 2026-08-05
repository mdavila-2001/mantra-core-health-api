import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_external_product_mappings`.
 */
@Entity({ schema: 'pharmacy', tableName: 'pharmacy_external_product_mappings' })
export class PharmacyExternalProductMappings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy integration connection.
   */
  @Property({ fieldName: 'pharmacy_integration_connection_id', type: 'uuid' }) // FK → pharmacy.pharmacy_integration_connections
  pharmacyIntegrationConnectionId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  /**
   * Valor de external product code mantenido por la instancia.
   */
  @Property({ fieldName: 'external_product_code', columnType: 'varchar' })
  externalProductCode!: string;

  /**
   * Valor de external unit code mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_unit_code',
    columnType: 'varchar',
    nullable: true,
  })
  externalUnitCode?: string;

  /**
   * Valor de mapping version mantenido por la instancia.
   */
  @Property({
    fieldName: 'mapping_version',
    columnType: 'varchar',
    nullable: true,
  })
  mappingVersion?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
