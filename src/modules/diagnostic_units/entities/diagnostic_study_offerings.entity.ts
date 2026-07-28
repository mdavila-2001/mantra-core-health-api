import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_study_offerings`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_study_offerings' })
export class DiagnosticStudyOfferings {
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
   * Valor de study code mantenido por la instancia.
   */
  @Property({ fieldName: 'study_code', columnType: 'varchar' })
  studyCode!: string;

  /**
   * Identificador asociado a study concept.
   */
  @Property({ fieldName: 'study_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  studyConceptId!: string;

  /**
   * Identificador asociado a modality concept.
   */
  @Property({ fieldName: 'modality_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  modalityConceptId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a specimen type concept.
   */
  @Property({
    fieldName: 'specimen_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  specimenTypeConceptId?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Valor de preparation instructions mantenido por la instancia.
   */
  @Property({
    fieldName: 'preparation_instructions',
    columnType: 'text',
    nullable: true,
  })
  preparationInstructions?: string;

  /**
   * Valor de expected duration minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  expectedDurationMinutes?: number;

  /**
   * Valor de expected turnaround minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_turnaround_minutes',
    columnType: 'int',
    nullable: true,
  })
  expectedTurnaroundMinutes?: number;

  /**
   * Valor de requires medical order mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_medical_order',
    type: 'boolean',
    nullable: true,
  })
  requiresMedicalOrder?: boolean;

  /**
   * Valor de requires prior authorization mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_prior_authorization',
    type: 'boolean',
    nullable: true,
  })
  requiresPriorAuthorization?: boolean;

  /**
   * Valor de home collection eligible mantenido por la instancia.
   */
  @Property({
    fieldName: 'home_collection_eligible',
    type: 'boolean',
    nullable: true,
  })
  homeCollectionEligible?: boolean;

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
