import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'consent', tableName: 'treatment_informed_consents' })
export class TreatmentInformedConsents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters
  encounterId!: string;

  @Property({
    fieldName: 'procedure_code_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  procedureCodeConceptId?: string;

  @Property({
    fieldName: 'information_version',
    columnType: 'varchar',
    nullable: true,
  })
  informationVersion?: string;

  @Property({ fieldName: 'interpreter_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  interpreterUserId?: string;

  @Property({ fieldName: 'witness_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  witnessUserId?: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  @Property({
    fieldName: 'withdrawn_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  withdrawnAt?: Date;

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
