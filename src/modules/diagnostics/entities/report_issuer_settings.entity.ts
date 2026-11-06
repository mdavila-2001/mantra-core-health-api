import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Maps `diagnostics.report_issuer_settings`: signature, seal and responsible
 * person of the organization that issues reports (one row per tenant).
 */
@Entity({ schema: 'diagnostics', tableName: 'report_issuer_settings' })
export class ReportIssuerSettings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'signature_file_id', type: 'uuid', nullable: true }) // FK → common.files
  signatureFileId?: string | null;

  @Property({ fieldName: 'seal_file_id', type: 'uuid', nullable: true }) // FK → common.files
  sealFileId?: string | null;

  @Property({
    fieldName: 'responsible_name',
    columnType: 'varchar',
    nullable: true,
  })
  responsibleName?: string | null;

  @Property({
    fieldName: 'responsible_title',
    columnType: 'varchar',
    nullable: true,
  })
  responsibleTitle?: string | null;

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
