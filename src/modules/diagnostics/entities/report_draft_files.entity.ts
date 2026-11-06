import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Maps `diagnostics.report_draft_files`: source document, original audio
 * (backup, never shown to the patient) and annexes of a report draft.
 */
@Entity({ schema: 'diagnostics', tableName: 'report_draft_files' })
export class ReportDraftFiles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'report_draft_id', type: 'uuid' }) // FK → diagnostics.report_drafts
  reportDraftId!: string;

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  /** `DOCUMENT`, `AUDIO` or `ANNEX`. */
  @Property({ fieldName: 'role_code', columnType: 'varchar' })
  roleCode!: string;

  @Property({ columnType: 'int' })
  ordinal!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
