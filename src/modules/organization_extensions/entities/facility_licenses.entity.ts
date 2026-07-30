import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `facility_licenses`.
 */
@Entity({ schema: 'organization_extensions', tableName: 'facility_licenses' })
export class FacilityLicenses {
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
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /**
   * Identificador asociado a facility type concept.
   */
  @Property({ fieldName: 'facility_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  facilityTypeConceptId!: string;

  /**
   * Identificador asociado a license type concept.
   */
  @Property({ fieldName: 'license_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  licenseTypeConceptId!: string;

  /**
   * Valor de license number mantenido por la instancia.
   */
  @Property({ fieldName: 'license_number', columnType: 'varchar' })
  licenseNumber!: string;

  /**
   * Identificador asociado a issuing authority tenant.
   */
  @Property({
    fieldName: 'issuing_authority_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  issuingAuthorityTenantId?: string;

  /**
   * Valor de issuing authority name mantenido por la instancia.
   */
  @Property({
    fieldName: 'issuing_authority_name',
    columnType: 'varchar',
    nullable: true,
  })
  issuingAuthorityName?: string;

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
   * Identificador asociado a evidence file.
   */
  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

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
