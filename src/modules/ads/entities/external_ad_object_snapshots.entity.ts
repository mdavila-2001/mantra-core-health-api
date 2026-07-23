import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'external_ad_object_snapshots' })
export class ExternalAdObjectSnapshots {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK (destino no resuelto)
  platformConnectionId!: string;

  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  @Property({ fieldName: 'external_object_id', columnType: 'varchar' })
  externalObjectId!: string;

  @Property({ fieldName: 'external_updated_at', columnType: 'timestamptz' })
  externalUpdatedAt!: Date;

  @Property({ fieldName: 'snapshot_at', columnType: 'timestamptz' })
  snapshotAt!: Date;

  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
