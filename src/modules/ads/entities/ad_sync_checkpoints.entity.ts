import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_sync_checkpoints' })
export class AdSyncCheckpoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK (destino no resuelto)
  platformConnectionId!: string;

  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  @Property({ fieldName: 'checkpoint_key', columnType: 'varchar' })
  checkpointKey!: string;

  @Property({
    fieldName: 'checkpoint_value_encrypted',
    columnType: 'text',
    nullable: true,
  })
  checkpointValueEncrypted?: string;

  @Property({ fieldName: 'checkpoint_at', columnType: 'timestamptz' })
  checkpointAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
