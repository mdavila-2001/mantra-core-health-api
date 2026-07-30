import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_sync_checkpoints`.
 */
@Entity({ schema: 'ads', tableName: 'ad_sync_checkpoints' })
export class AdSyncCheckpoints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a platform connection.
   */
  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK → ads.ad_platform_connections
  platformConnectionId!: string;

  /**
   * Identificador asociado a object type concept.
   */
  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  /**
   * Valor de checkpoint key mantenido por la instancia.
   */
  @Property({ fieldName: 'checkpoint_key', columnType: 'varchar' })
  checkpointKey!: string;

  /**
   * Valor de checkpoint value encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'checkpoint_value_encrypted',
    columnType: 'text',
    nullable: true,
  })
  checkpointValueEncrypted?: string;

  /**
   * Valor de checkpoint at mantenido por la instancia.
   */
  @Property({ fieldName: 'checkpoint_at', columnType: 'timestamptz' })
  checkpointAt!: Date;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;
}
