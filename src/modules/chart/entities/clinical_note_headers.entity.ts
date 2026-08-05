import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `clinical_note_headers`.
 */
@Entity({ schema: 'chart', tableName: 'clinical_note_headers' })
export class ClinicalNoteHeaders {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a note type concept.
   */
  @Property({ fieldName: 'note_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  noteTypeConceptId!: string;

  /**
   * Identificador asociado a lifecycle status concept.
   */
  @Property({ fieldName: 'lifecycle_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  lifecycleStatusConceptId!: string;

  /**
   * Identificador asociado a current version.
   */
  @Property({ fieldName: 'current_version_id', type: 'uuid', nullable: true }) // FK → chart.clinical_note_versions
  currentVersionId?: string;

  /**
   * Identificador asociado a current released version.
   */
  @Property({
    fieldName: 'current_released_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → chart.clinical_note_versions
  currentReleasedVersionId?: string;

  /**
   * Identificador asociado a patient release status concept.
   */
  @Property({
    fieldName: 'patient_release_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  patientReleaseStatusConceptId?: string;

  /**
   * Identificador asociado a confidentiality concept.
   */
  @Property({
    fieldName: 'confidentiality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  confidentialityConceptId?: string;

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
