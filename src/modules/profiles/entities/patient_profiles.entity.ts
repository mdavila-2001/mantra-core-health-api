import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_profiles`.
 */
@Entity({ schema: 'profiles', tableName: 'patient_profiles' })
export class PatientProfiles {
  /**
   * Identificador asociado a profile.
   */
  @PrimaryKey({ fieldName: 'profile_id', type: 'uuid' })
  profileId: string = randomUUID();

  /**
   * Valor de patient code mantenido por la instancia.
   */
  @Property({ fieldName: 'patient_code', columnType: 'varchar' })
  patientCode!: string;

  /**
   * Valor de master patient index code mantenido por la instancia.
   */
  @Property({
    fieldName: 'master_patient_index_code',
    columnType: 'varchar',
    nullable: true,
  })
  masterPatientIndexCode?: string;

  /**
   * Identificador asociado a abo group concept.
   */
  @Property({ fieldName: 'abo_group_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  aboGroupConceptId?: string;

  /**
   * Identificador asociado a rh factor concept.
   */
  @Property({ fieldName: 'rh_factor_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  rhFactorConceptId?: string;

  /**
   * Identificador asociado a insurance status concept.
   */
  @Property({
    fieldName: 'insurance_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  insuranceStatusConceptId?: string;

  /**
   * Identificador asociado a clinical language concept.
   */
  @Property({
    fieldName: 'clinical_language_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  clinicalLanguageConceptId?: string;

  /**
   * Identificador asociado a record linkage status concept.
   */
  @Property({
    fieldName: 'record_linkage_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  recordLinkageStatusConceptId?: string;

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
