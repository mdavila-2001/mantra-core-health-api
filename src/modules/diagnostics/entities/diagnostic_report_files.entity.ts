import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'diagnostic_report_files' })
export class DiagnosticReportFiles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'diagnostic_report_version_id', type: 'uuid' }) // FK → diagnostics.diagnostic_report_versions
  diagnosticReportVersionId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  @Property({ fieldName: 'content_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentRoleConceptId!: string;

  @Property({
    fieldName: 'presentation_format_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  presentationFormatConceptId?: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
