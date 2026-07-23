import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'storage_backends' })
export class StorageBackends {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'backend_type', columnType: 'varchar' })
  backendType!: string;

  @Property({ fieldName: 'provider_code', columnType: 'varchar' })
  providerCode!: string;

  @Property({ fieldName: 'control_plane_endpoint', columnType: 'varchar' })
  controlPlaneEndpoint!: string;

  @Property({ fieldName: 'supports_transactions', type: 'boolean' })
  supportsTransactions!: boolean;

  @Property({ fieldName: 'supports_ttl', type: 'boolean' })
  supportsTtl!: boolean;

  @Property({ fieldName: 'supports_encryption', type: 'boolean' })
  supportsEncryption!: boolean;

  @Property({ fieldName: 'supports_versioning', type: 'boolean' })
  supportsVersioning!: boolean;

  @Property({ fieldName: 'supports_worm', type: 'boolean' })
  supportsWorm!: boolean;

  @Property({ fieldName: 'supports_vector_search', type: 'boolean' })
  supportsVectorSearch!: boolean;

  @Property({ fieldName: 'supports_full_text', type: 'boolean' })
  supportsFullText!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
