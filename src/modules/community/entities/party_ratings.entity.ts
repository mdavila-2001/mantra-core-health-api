import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `party_ratings`.
 */
@Entity({ schema: 'community', tableName: 'party_ratings' })
export class PartyRatings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a reviewer patient profile.
   */
  @Property({
    fieldName: 'reviewer_patient_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  reviewerPatientProfileId?: string;

  /**
   * Identificador asociado a reviewer practitioner profile.
   */
  @Property({
    fieldName: 'reviewer_practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  reviewerPractitionerProfileId?: string;

  /**
   * Identificador asociado a reviewer practice.
   */
  @Property({ fieldName: 'reviewer_practice_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  reviewerPracticeId?: string;

  /**
   * Identificador asociado a target patient profile.
   */
  @Property({
    fieldName: 'target_patient_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  targetPatientProfileId?: string;

  /**
   * Identificador asociado a target practitioner profile.
   */
  @Property({
    fieldName: 'target_practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  targetPractitionerProfileId?: string;

  /**
   * Identificador asociado a target practice.
   */
  @Property({ fieldName: 'target_practice_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  targetPracticeId?: string;

  /**
   * Identificador asociado a verified encounter.
   */
  @Property({
    fieldName: 'verified_encounter_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  verifiedEncounterId?: string;

  /**
   * Identificador asociado a verified role assignment.
   */
  @Property({
    fieldName: 'verified_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  verifiedRoleAssignmentId?: string;

  /**
   * Valor de overall rating mantenido por la instancia.
   */
  @Property({ fieldName: 'overall_rating', columnType: 'smallint' })
  overallRating!: number;

  /**
   * Valor de comment text mantenido por la instancia.
   */
  @Property({ fieldName: 'comment_text', columnType: 'text', nullable: true })
  commentText?: string;

  /**
   * Identificador asociado a moderation status concept.
   */
  @Property({ fieldName: 'moderation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  moderationStatusConceptId!: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
