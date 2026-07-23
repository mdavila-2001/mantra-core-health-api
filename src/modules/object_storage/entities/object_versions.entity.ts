import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_versions' })
export class ObjectVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'provider_version_id', columnType: 'varchar' })
  providerVersionId!: string;

  @Property({ fieldName: 'object_key', columnType: 'varchar' })
  objectKey!: string;

  @Property({ fieldName: 'mime_type', columnType: 'varchar' })
  mimeType!: string;

  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Property({ columnType: 'varchar' })
  sha256!: string;

  @Property({ columnType: 'varchar' })
  etag!: string;

  @Property({ columnType: 'varchar' })
  compression!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'supersedes_version_id', type: 'uuid' })
  supersedesVersionId!: string;
}
