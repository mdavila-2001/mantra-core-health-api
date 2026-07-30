import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_report_versions`.
 */
@Entity({ schema: 'diagnostics', tableName: 'diagnostic_report_versions' })
export class DiagnosticReportVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a diagnostic report.
   */
  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid' }) // FK → clinical.diagnostic_reports
  diagnosticReportId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a clinical status concept.
   */
  @Property({ fieldName: 'clinical_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  clinicalStatusConceptId!: string;

  /**
   * Valor de conclusion text mantenido por la instancia.
   */
  @Property({
    fieldName: 'conclusion_text',
    columnType: 'text',
    nullable: true,
  })
  conclusionText?: string;

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  /**
   * Identificador asociado a performer tenant.
   */
  @Property({ fieldName: 'performer_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  performerTenantId?: string;

  /**
   * Identificador asociado a author profile.
   */
  @Property({ fieldName: 'author_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  authorProfileId?: string;

  /**
   * Identificador asociado a supersedes version.
   */
  @Property({
    fieldName: 'supersedes_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.diagnostic_report_versions
  supersedesVersionId?: string;

  /**
   * Identificador asociado a amendment reason concept.
   */
  @Property({
    fieldName: 'amendment_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  amendmentReasonConceptId?: string;

  /**
   * Valor de amendment reason text mantenido por la instancia.
   */
  @Property({
    fieldName: 'amendment_reason_text',
    columnType: 'text',
    nullable: true,
  })
  amendmentReasonText?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  /**
   * Identificador asociado a release eligibility concept.
   */
  @Property({
    fieldName: 'release_eligibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  releaseEligibilityConceptId?: string;

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

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a source system.
   */
  @Property({ fieldName: 'source_system_id', type: 'uuid', nullable: true }) // FK → health_data.health_source_systems
  sourceSystemId?: string;

  /**
   * Identificador asociado a provenance record.
   */
  @Property({ fieldName: 'provenance_record_id', type: 'uuid', nullable: true }) // FK → health_data.health_provenance_records
  provenanceRecordId?: string;
}
