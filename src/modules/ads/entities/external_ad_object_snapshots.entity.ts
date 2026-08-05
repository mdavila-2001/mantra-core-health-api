import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `external_ad_object_snapshots`.
 */
@Entity({ schema: 'ads', tableName: 'external_ad_object_snapshots' })
export class ExternalAdObjectSnapshots {
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
   * Identificador asociado a external object.
   */
  @Property({ fieldName: 'external_object_id', columnType: 'varchar' })
  externalObjectId!: string;

  /**
   * Valor de external updated at mantenido por la instancia.
   */
  @Property({ fieldName: 'external_updated_at', columnType: 'timestamptz' })
  externalUpdatedAt!: Date;

  /**
   * Valor de snapshot at mantenido por la instancia.
   */
  @Property({ fieldName: 'snapshot_at', columnType: 'timestamptz' })
  snapshotAt!: Date;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
