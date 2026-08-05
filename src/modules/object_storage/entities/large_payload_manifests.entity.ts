import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `large_payload_manifests`.
 */
@Entity({ schema: 'object_storage', tableName: 'large_payload_manifests' })
export class LargePayloadManifests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de payload type mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_type', columnType: 'varchar' })
  payloadType!: string;

  /**
   * Valor de source entity type mantenido por la instancia.
   */
  @Property({ fieldName: 'source_entity_type', columnType: 'varchar' })
  sourceEntityType!: string;

  /**
   * Identificador asociado a source entity.
   */
  @Property({ fieldName: 'source_entity_id', type: 'uuid' })
  sourceEntityId!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
