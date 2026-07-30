import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `analytics_subjects`.
 */
@Entity({ schema: 'telemetry', tableName: 'analytics_subjects' })
export class AnalyticsSubjects {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  /**
   * Valor de pseudonymous subject key mantenido por la instancia.
   */
  @Property({ fieldName: 'pseudonymous_subject_key', columnType: 'varchar' })
  pseudonymousSubjectKey!: string;

  /**
   * Valor de key version mantenido por la instancia.
   */
  @Property({ fieldName: 'key_version', columnType: 'int', nullable: true })
  keyVersion?: number;

  /**
   * Identificador asociado a rotated from subject.
   */
  @Property({
    fieldName: 'rotated_from_subject_id',
    type: 'uuid',
    nullable: true,
  }) // FK → telemetry.analytics_subjects
  rotatedFromSubjectId?: string;

  /**
   * Identificador asociado a created from consent.
   */
  @Property({
    fieldName: 'created_from_consent_id',
    type: 'uuid',
    nullable: true,
  }) // FK → consent.consents
  createdFromConsentId?: string;

  /**
   * Valor de deactivated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'deactivated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deactivatedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
