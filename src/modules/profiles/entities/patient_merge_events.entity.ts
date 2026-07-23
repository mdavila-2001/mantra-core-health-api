import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'patient_merge_events' })
export class PatientMergeEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'surviving_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  survivingPatientProfileId!: string;

  @Property({ fieldName: 'merged_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  mergedPatientProfileId!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reasonConceptId!: string;

  @Property({ fieldName: 'decision_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionStatusConceptId!: string;

  @Property({ fieldName: 'approved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  approvedByUserId?: string;

  @Property({ fieldName: 'reversal_of_event_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  reversalOfEventId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
