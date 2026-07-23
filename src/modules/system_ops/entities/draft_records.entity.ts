import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'draft_records' })
export class DraftRecords {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'schema_name', columnType: 'varchar' })
  schemaName!: string;

  @Property({ fieldName: 'table_name', columnType: 'varchar' })
  tableName!: string;

  @Property({ fieldName: 'target_record_id', type: 'uuid', nullable: true })
  targetRecordId?: string;

  @Property({ fieldName: 'owner_user_id', type: 'uuid' }) // FK → iam.users
  ownerUserId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'draft_label', columnType: 'varchar', nullable: true })
  draftLabel?: string;

  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'schema_version', columnType: 'int', nullable: true })
  schemaVersion?: number;

  @Property({ fieldName: 'published_record_id', type: 'uuid', nullable: true })
  publishedRecordId?: string;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

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
