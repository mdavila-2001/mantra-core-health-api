import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'storage_capabilities' })
export class StorageCapabilities {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'storage_backend_id', type: 'uuid' }) // FK → polyglot_storage.storage_backends
  storageBackendId!: string;

  @Property({ fieldName: 'capability_code', columnType: 'varchar' })
  capabilityCode!: string;

  @Property({ fieldName: 'capability_version', columnType: 'varchar' })
  capabilityVersion!: string;

  @Property({
    fieldName: 'configuration_json',
    type: 'json',
    columnType: 'jsonb',
  })
  configurationJson!: unknown;

  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;

  @Property({ fieldName: 'verification_status', columnType: 'varchar' })
  verificationStatus!: string;
}
