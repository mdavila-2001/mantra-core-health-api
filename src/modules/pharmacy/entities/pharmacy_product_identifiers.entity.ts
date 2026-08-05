import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_product_identifiers`.
 */
@Entity({ schema: 'pharmacy', tableName: 'pharmacy_product_identifiers' })
export class PharmacyProductIdentifiers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  /**
   * Identificador asociado a identifier type concept.
   */
  @Property({ fieldName: 'identifier_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  identifierTypeConceptId!: string;

  /**
   * Valor de identifier value mantenido por la instancia.
   */
  @Property({ fieldName: 'identifier_value', columnType: 'varchar' })
  identifierValue!: string;

  /**
   * Identificador asociado a assigning authority tenant.
   */
  @Property({
    fieldName: 'assigning_authority_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  assigningAuthorityTenantId?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
