import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'key_rotation_events' })
export class KeyRotationEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'encryption_key_id', type: 'uuid' }) // FK → system_ops.encryption_keys
  encryptionKeyId!: string;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ fieldName: 'from_version', columnType: 'int', nullable: true })
  fromVersion?: number;

  @Property({ fieldName: 'to_version', columnType: 'int', nullable: true })
  toVersion?: number;

  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  @Property({ fieldName: 'performed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  performedByUserId?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
