import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_export_jobs' })
export class HealthExportJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'export_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  exportTypeConceptId!: string;

  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' }) // FK → iam.users
  requestedByUserId!: string;

  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  @Property({ fieldName: 'cohort_definition_id', type: 'uuid', nullable: true }) // FK → lakehouse.cohort_definitions
  cohortDefinitionId?: string;

  @Property({ fieldName: 'consent_directive_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentDirectiveId?: string;

  @Property({
    fieldName: 'deidentification_run_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.health_deidentification_runs
  deidentificationRunId?: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({
    fieldName: 'delivery_destination_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  deliveryDestinationJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
