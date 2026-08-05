import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `service_reviews`.
 */
@Entity({ schema: 'community', tableName: 'service_reviews' })
export class ServiceReviews {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a target public profile.
   */
  @Property({ fieldName: 'target_public_profile_id', type: 'uuid' }) // FK → community.public_profiles
  targetPublicProfileId!: string;

  /**
   * Identificador asociado a reviewer patient profile.
   */
  @Property({ fieldName: 'reviewer_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  reviewerPatientProfileId!: string;

  /**
   * Identificador asociado a verified encounter.
   */
  @Property({
    fieldName: 'verified_encounter_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.encounters
  verifiedEncounterId?: string;

  /**
   * Valor de overall rating mantenido por la instancia.
   */
  @Property({ fieldName: 'overall_rating', columnType: 'smallint' })
  overallRating!: number;

  /**
   * Valor de review text mantenido por la instancia.
   */
  @Property({ fieldName: 'review_text', columnType: 'text', nullable: true })
  reviewText?: string;

  /**
   * Identificador asociado a reviewer display mode concept.
   */
  @Property({
    fieldName: 'reviewer_display_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reviewerDisplayModeConceptId?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  /**
   * Identificador asociado a moderation status concept.
   */
  @Property({ fieldName: 'moderation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  moderationStatusConceptId!: string;

  /**
   * Identificador asociado a publication status concept.
   */
  @Property({ fieldName: 'publication_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  publicationStatusConceptId!: string;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  /**
   * Valor de edited at mantenido por la instancia.
   */
  @Property({
    fieldName: 'edited_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  editedAt?: Date;

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
