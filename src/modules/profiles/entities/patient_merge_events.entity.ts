import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_merge_events`.
 */
@Entity({ schema: 'profiles', tableName: 'patient_merge_events' })
export class PatientMergeEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a surviving patient profile.
   */
  @Property({ fieldName: 'surviving_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  survivingPatientProfileId!: string;

  /**
   * Identificador asociado a merged patient profile.
   */
  @Property({ fieldName: 'merged_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  mergedPatientProfileId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  /**
   * Identificador asociado a decision status concept.
   */
  @Property({ fieldName: 'decision_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionStatusConceptId!: string;

  /**
   * Identificador asociado a approved by user.
   */
  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  /**
   * Identificador asociado a reversal of event.
   */
  @Property({ fieldName: 'reversal_of_event_id', type: 'uuid', nullable: true }) // FK → profiles.patient_merge_events
  reversalOfEventId?: string;

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
