import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'patient_identity_members' })
export class PatientIdentityMembers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_identity_cluster_id', type: 'uuid' }) // FK → health_data.patient_identity_clusters
  patientIdentityClusterId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  sourceSystemId?: string;

  @Property({
    fieldName: 'source_patient_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  sourcePatientIdentifier?: string;

  @Property({ fieldName: 'member_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberRoleConceptId!: string;

  @Property({ fieldName: 'match_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  matchStatusConceptId!: string;

  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric(8,5)',
    nullable: true,
  })
  confidenceScore?: string;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
