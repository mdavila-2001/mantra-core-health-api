import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'multipart_uploads' })
export class MultipartUploads {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'namespace_id', type: 'uuid' })
  namespaceId!: string;

  @Property({ fieldName: 'provider_upload_id', columnType: 'varchar' })
  providerUploadId!: string;

  @Property({ fieldName: 'target_object_key', columnType: 'varchar' })
  targetObjectKey!: string;

  @Property({ fieldName: 'expected_size_bytes', type: 'bigint' })
  expectedSizeBytes!: string;

  @Property({ fieldName: 'received_size_bytes', type: 'bigint' })
  receivedSizeBytes!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
