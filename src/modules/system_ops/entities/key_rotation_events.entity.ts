import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `key_rotation_events`.
 */
@Entity({ schema: 'system_ops', tableName: 'key_rotation_events' })
export class KeyRotationEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a encryption key.
   */
  @Property({ fieldName: 'encryption_key_id', type: 'uuid' }) // FK → system_ops.encryption_keys
  encryptionKeyId!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Valor de from version mantenido por la instancia.
   */
  @Property({ fieldName: 'from_version', columnType: 'int', nullable: true })
  fromVersion?: number;

  /**
   * Valor de to version mantenido por la instancia.
   */
  @Property({ fieldName: 'to_version', columnType: 'int', nullable: true })
  toVersion?: number;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  reason?: string;

  /**
   * Identificador asociado a performed by user.
   */
  @Property({ fieldName: 'performed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  performedByUserId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
