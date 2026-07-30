import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_unit_sites`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_unit_sites' })
export class DiagnosticUnitSites {
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
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites
  practiceSiteId!: string;

  /**
   * Identificador asociado a site role concept.
   */
  @Property({ fieldName: 'site_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  siteRoleConceptId!: string;

  /**
   * Valor de accession prefix mantenido por la instancia.
   */
  @Property({
    fieldName: 'accession_prefix',
    columnType: 'varchar',
    nullable: true,
  })
  accessionPrefix?: string;

  /**
   * Valor de sample collection available mantenido por la instancia.
   */
  @Property({
    fieldName: 'sample_collection_available',
    type: 'boolean',
    nullable: true,
  })
  sampleCollectionAvailable?: boolean;

  /**
   * Valor de imaging available mantenido por la instancia.
   */
  @Property({ fieldName: 'imaging_available', type: 'boolean', nullable: true })
  imagingAvailable?: boolean;

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
