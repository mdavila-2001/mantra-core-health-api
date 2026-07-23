import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'archive_manifests' })
export class ArchiveManifests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'archive_type', columnType: 'varchar' })
  archiveType!: string;

  @Property({
    fieldName: 'source_scope_json',
    type: 'json',
    columnType: 'jsonb',
  })
  sourceScopeJson!: unknown;

  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  @Property({ fieldName: 'record_count', type: 'bigint' })
  recordCount!: string;

  @Property({ fieldName: 'manifest_hash', columnType: 'varchar' })
  manifestHash!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;
}
