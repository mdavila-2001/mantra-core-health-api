import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'patient_match_candidates' })
export class PatientMatchCandidates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'left_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  leftPatientProfileId!: string;

  @Property({ fieldName: 'right_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  rightPatientProfileId!: string;

  @Property({ fieldName: 'algorithm_version', columnType: 'varchar' })
  algorithmVersion!: string;

  @Property({ fieldName: 'match_score', columnType: 'numeric(8,5)' })
  matchScore!: string;

  @Property({
    fieldName: 'matching_features_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  matchingFeaturesJson?: unknown;

  @Property({
    fieldName: 'conflicting_features_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conflictingFeaturesJson?: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'generated_at', columnType: 'timestamptz' })
  generatedAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
