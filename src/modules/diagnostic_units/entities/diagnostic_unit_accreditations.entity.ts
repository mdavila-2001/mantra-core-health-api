import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_unit_accreditations`.
 */
@Entity({
  schema: 'diagnostic_units',
  tableName: 'diagnostic_unit_accreditations',
})
export class DiagnosticUnitAccreditations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a diagnostic unit.
   */
  @Property({ fieldName: 'diagnostic_unit_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_units
  diagnosticUnitId!: string;

  /**
   * Identificador asociado a diagnostic unit site.
   */
  @Property({
    fieldName: 'diagnostic_unit_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostic_units.diagnostic_unit_sites
  diagnosticUnitSiteId?: string;

  /**
   * Identificador asociado a accreditation concept.
   */
  @Property({ fieldName: 'accreditation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accreditationConceptId!: string;

  /**
   * Valor de accreditation number mantenido por la instancia.
   */
  @Property({
    fieldName: 'accreditation_number',
    columnType: 'varchar',
    nullable: true,
  })
  accreditationNumber?: string;

  /**
   * Identificador asociado a issuer tenant.
   */
  @Property({ fieldName: 'issuer_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  issuerTenantId?: string;

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
