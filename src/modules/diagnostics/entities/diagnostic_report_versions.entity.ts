import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'diagnostic_report_versions' })
export class DiagnosticReportVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid' }) // FK → clinical.diagnostic_reports
  diagnosticReportId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'clinical_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  clinicalStatusConceptId!: string;

  @Property({
    fieldName: 'conclusion_text',
    columnType: 'text',
    nullable: true,
  })
  conclusionText?: string;

  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  @Property({ fieldName: 'performer_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  performerTenantId?: string;

  @Property({ fieldName: 'author_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  authorProfileId?: string;

  @Property({
    fieldName: 'supersedes_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.diagnostic_report_versions
  supersedesVersionId?: string;

  @Property({
    fieldName: 'amendment_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  amendmentReasonConceptId?: string;

  @Property({
    fieldName: 'amendment_reason_text',
    columnType: 'text',
    nullable: true,
  })
  amendmentReasonText?: string;

  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  @Property({
    fieldName: 'release_eligibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  releaseEligibilityConceptId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK → health_data.health_source_systems
  sourceSystemId?: string;

  @Property({ fieldName: 'provenance_record_id', type: 'uuid', nullable: true }) // FK → health_data.health_provenance_records
  provenanceRecordId?: string;
}
