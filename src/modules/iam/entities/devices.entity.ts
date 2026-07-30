import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `devices`.
 */
@Entity({ schema: 'iam', tableName: 'devices' })
export class Devices {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Valor de device fingerprint mantenido por la instancia.
   */
  @Property({
    fieldName: 'device_fingerprint',
    columnType: 'varchar',
    nullable: true,
  })
  deviceFingerprint?: string;

  /**
   * Identificador asociado a platform concept.
   */
  @Property({ fieldName: 'platform_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  platformConceptId?: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  name?: string;

  /**
   * Valor de push token encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'push_token_encrypted',
    columnType: 'text',
    nullable: true,
  })
  pushTokenEncrypted?: string;

  /**
   * Valor de trusted mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  trusted?: boolean;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSeenAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
