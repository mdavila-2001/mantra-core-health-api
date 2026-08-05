import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `business_partner_tax_registrations`.
 */
@Entity({ schema: 'erp', tableName: 'business_partner_tax_registrations' })
export class BusinessPartnerTaxRegistrations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a business partner.
   */
  @Property({ fieldName: 'business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  businessPartnerId!: string;

  /**
   * Identificador asociado a tax type concept.
   */
  @Property({ fieldName: 'tax_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  taxTypeConceptId!: string;

  /**
   * Valor de tax number mantenido por la instancia.
   */
  @Property({ fieldName: 'tax_number', columnType: 'varchar' })
  taxNumber!: string;

  /**
   * Identificador asociado a country concept.
   */
  @Property({ fieldName: 'country_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  countryConceptId?: string;

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
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

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
