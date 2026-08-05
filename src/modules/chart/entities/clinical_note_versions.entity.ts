import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `clinical_note_versions`.
 */
@Entity({ schema: 'chart', tableName: 'clinical_note_versions' })
export class ClinicalNoteVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a clinical note.
   */
  @Property({ fieldName: 'clinical_note_id', type: 'uuid' }) // FK → chart.clinical_note_headers
  clinicalNoteId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a author profile.
   */
  @Property({ fieldName: 'author_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  authorProfileId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de chief complaint text mantenido por la instancia.
   */
  @Property({
    fieldName: 'chief_complaint_text',
    columnType: 'text',
    nullable: true,
  })
  chiefComplaintText?: string;

  /**
   * Valor de subjective text mantenido por la instancia.
   */
  @Property({
    fieldName: 'subjective_text',
    columnType: 'text',
    nullable: true,
  })
  subjectiveText?: string;

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @Property({ fieldName: 'objective_text', columnType: 'text', nullable: true })
  objectiveText?: string;

  /**
   * Valor de assessment text mantenido por la instancia.
   */
  @Property({
    fieldName: 'assessment_text',
    columnType: 'text',
    nullable: true,
  })
  assessmentText?: string;

  /**
   * Valor de plan text mantenido por la instancia.
   */
  @Property({ fieldName: 'plan_text', columnType: 'text', nullable: true })
  planText?: string;

  /**
   * Identificador asociado a supersedes version.
   */
  @Property({
    fieldName: 'supersedes_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → chart.clinical_note_versions
  supersedesVersionId?: string;

  /**
   * Identificador asociado a amendment reason concept.
   */
  @Property({
    fieldName: 'amendment_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  amendmentReasonConceptId?: string;

  /**
   * Valor de amendment reason text mantenido por la instancia.
   */
  @Property({
    fieldName: 'amendment_reason_text',
    columnType: 'text',
    nullable: true,
  })
  amendmentReasonText?: string;

  /**
   * Identificador asociado a signed by profile.
   */
  @Property({ fieldName: 'signed_by_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  signedByProfileId?: string;

  /**
   * Valor de signed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  /**
   * Identificador asociado a release eligibility concept.
   */
  @Property({
    fieldName: 'release_eligibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  releaseEligibilityConceptId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
