import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_deidentification_runs' })
export class HealthDeidentificationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'health_deidentification_profile_id', type: 'uuid' }) // FK → health_data.health_deidentification_profiles
  healthDeidentificationProfileId!: string;

  @Property({ fieldName: 'purpose_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeConceptId!: string;

  @Property({ fieldName: 'consent_directive_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentDirectiveId?: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'input_manifest_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  inputManifestFileId?: string;

  @Property({
    fieldName: 'output_manifest_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  outputManifestFileId?: string;

  @Property({ fieldName: 'records_processed', type: 'bigint', nullable: true })
  recordsProcessed?: string;

  @Property({ fieldName: 'records_rejected', type: 'bigint', nullable: true })
  recordsRejected?: string;

  @Property({
    fieldName: 'verification_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  verificationSummaryJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
