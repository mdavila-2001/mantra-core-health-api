import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audit', tableName: 'patient_content_access_log' })
export class PatientContentAccessLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  @Property({ fieldName: 'resource_id', type: 'uuid' })
  resourceId!: string;

  @Property({ fieldName: 'resource_version_id', type: 'uuid', nullable: true })
  resourceVersionId?: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  decisionConceptId?: string;

  @Property({
    fieldName: 'policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  policyVersion?: string;

  @Property({ fieldName: 'request_id', type: 'uuid', nullable: true })
  requestId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
