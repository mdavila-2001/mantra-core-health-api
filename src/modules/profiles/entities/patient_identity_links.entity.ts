import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'patient_identity_links' })
export class PatientIdentityLinks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'source_tenant_id', type: 'uuid' }) // FK → directory.tenants
  sourceTenantId!: string;

  @Property({ fieldName: 'source_patient_identifier', columnType: 'varchar' })
  sourcePatientIdentifier!: string;

  @Property({
    fieldName: 'source_system_uri',
    columnType: 'text',
    nullable: true,
  })
  sourceSystemUri?: string;

  @Property({ fieldName: 'link_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  linkTypeConceptId!: string;

  @Property({ fieldName: 'confidence_score', columnType: 'numeric' })
  confidenceScore!: string;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  @Property({ fieldName: 'verified_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  verifiedByUserId?: string;

  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
