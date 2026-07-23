import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'large_payload_manifests' })
export class LargePayloadManifests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'payload_type', columnType: 'varchar' })
  payloadType!: string;

  @Property({ fieldName: 'source_entity_type', columnType: 'varchar' })
  sourceEntityType!: string;

  @Property({ fieldName: 'source_entity_id', type: 'uuid' })
  sourceEntityId!: string;

  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
