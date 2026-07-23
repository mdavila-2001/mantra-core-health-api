import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_locations' })
export class ObjectLocations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_version_id', type: 'uuid' })
  objectVersionId!: string;

  @Property({ fieldName: 'namespace_id', type: 'uuid' })
  namespaceId!: string;

  @Property({ fieldName: 'placement_role', columnType: 'varchar' })
  placementRole!: string;

  @Property({ fieldName: 'provider_uri', columnType: 'varchar' })
  providerUri!: string;

  @Property({ fieldName: 'storage_class', columnType: 'varchar' })
  storageClass!: string;

  @Property({ fieldName: 'replication_state', columnType: 'varchar' })
  replicationState!: string;

  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;
}
