import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_encryption_envelopes' })
export class ObjectEncryptionEnvelopes {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  @Property({ columnType: 'varchar' })
  algorithm!: string;

  @Property({ fieldName: 'key_management_provider', columnType: 'varchar' })
  keyManagementProvider!: string;

  @Property({ fieldName: 'encrypted_data_key', columnType: 'bytea' })
  encryptedDataKey!: string;

  @Property({ fieldName: 'key_version', columnType: 'varchar' })
  keyVersion!: string;

  @Property({ fieldName: 'encryption_context_hash', columnType: 'varchar' })
  encryptionContextHash!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
