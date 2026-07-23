import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'storage_backend_regions' })
export class StorageBackendRegions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'storage_backend_id', type: 'uuid' }) // FK → polyglot_storage.storage_backends
  storageBackendId!: string;

  @Property({ fieldName: 'region_code', columnType: 'varchar' })
  regionCode!: string;

  @Property({ fieldName: 'country_code', columnType: 'char(2)' })
  countryCode!: string;

  @Property({ fieldName: 'jurisdiction_code', columnType: 'varchar' })
  jurisdictionCode!: string;

  @Property({ fieldName: 'endpoint_uri', columnType: 'varchar' })
  endpointUri!: string;

  @Property({ fieldName: 'is_primary', type: 'boolean' })
  isPrimary!: boolean;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
