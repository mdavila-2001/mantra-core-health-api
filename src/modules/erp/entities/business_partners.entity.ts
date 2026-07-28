import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `business_partners`.
 */
@Entity({ schema: 'erp', tableName: 'business_partners' })
export class BusinessPartners {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de partner number mantenido por la instancia.
   */
  @Property({ fieldName: 'partner_number', columnType: 'varchar' })
  partnerNumber!: string;

  /**
   * Identificador asociado a partner category concept.
   */
  @Property({ fieldName: 'partner_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partnerCategoryConceptId!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @Property({ fieldName: 'legal_name', columnType: 'varchar', nullable: true })
  legalName?: string;

  /**
   * Identificador asociado a tax.
   */
  @Property({ fieldName: 'tax_id', columnType: 'varchar', nullable: true })
  taxId?: string;

  /**
   * Identificador asociado a country concept.
   */
  @Property({ fieldName: 'country_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  countryConceptId?: string;

  /**
   * Identificador asociado a linked tenant.
   */
  @Property({ fieldName: 'linked_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  linkedTenantId?: string;

  /**
   * Identificador asociado a linked person.
   */
  @Property({ fieldName: 'linked_person_id', type: 'uuid', nullable: true }) // FK → profiles.persons
  linkedPersonId?: string;

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
