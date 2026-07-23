import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_namespaces' })
export class ObjectNamespaces {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'backend_code', columnType: 'varchar' })
  backendCode!: string;

  @Property({ fieldName: 'region_code', columnType: 'varchar' })
  regionCode!: string;

  @Property({ fieldName: 'bucket_or_container', columnType: 'varchar' })
  bucketOrContainer!: string;

  @Property({ fieldName: 'object_key_prefix', columnType: 'varchar' })
  objectKeyPrefix!: string;

  @Property({ fieldName: 'default_storage_class', columnType: 'varchar' })
  defaultStorageClass!: string;

  @Property({ fieldName: 'versioning_enabled', type: 'boolean' })
  versioningEnabled!: boolean;

  @Property({ fieldName: 'object_lock_enabled', type: 'boolean' })
  objectLockEnabled!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;
}
