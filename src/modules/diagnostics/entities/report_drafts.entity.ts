import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Maps `diagnostics.report_drafts`: the written report of one order in the
 * tenant that reports it. Once `PUBLISHED` it is frozen (database trigger).
 */
@Entity({ schema: 'diagnostics', tableName: 'report_drafts' })
export class ReportDrafts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'service_request_id', type: 'uuid' }) // FK → clinical.service_requests
  serviceRequestId!: string;

  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

  /** Structured document (`ReportBody`); see `report-body.ts`. */
  @Property({ fieldName: 'body_json', type: 'json', columnType: 'jsonb' })
  bodyJson!: unknown;

  @Property({
    fieldName: 'conclusion_text',
    columnType: 'text',
    nullable: true,
  })
  conclusionText?: string | null;

  @Property({ fieldName: 'signer_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  signerProfileId?: string | null;

  /** `VISIBLE` or `HELD`: patient visibility applied at publish time. */
  @Property({ fieldName: 'patient_visibility_code', columnType: 'varchar' })
  patientVisibilityCode!: string;

  /** `DRAFT` or `PUBLISHED`. */
  @Property({ fieldName: 'status_code', columnType: 'varchar' })
  statusCode!: string;

  @Property({ fieldName: 'published_version_id', type: 'uuid', nullable: true }) // FK → diagnostics.diagnostic_report_versions
  publishedVersionId?: string;

  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  @Property({ fieldName: 'published_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  publishedByUserId?: string;

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
