import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'analytics_subjects' })
export class AnalyticsSubjects {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  @Property({ fieldName: 'pseudonymous_subject_key', columnType: 'varchar' })
  pseudonymousSubjectKey!: string;

  @Property({ fieldName: 'key_version', columnType: 'int', nullable: true })
  keyVersion?: number;

  @Property({
    fieldName: 'rotated_from_subject_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  rotatedFromSubjectId?: string;

  @Property({
    fieldName: 'created_from_consent_id',
    type: 'uuid',
    nullable: true,
  }) // FK → consent.consents
  createdFromConsentId?: string;

  @Property({
    fieldName: 'deactivated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deactivatedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
