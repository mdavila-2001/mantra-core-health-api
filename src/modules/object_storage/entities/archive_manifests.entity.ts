import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `archive_manifests`.
 */
@Entity({ schema: 'object_storage', tableName: 'archive_manifests' })
export class ArchiveManifests {
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
   * Valor de archive type mantenido por la instancia.
   */
  @Property({ fieldName: 'archive_type', columnType: 'varchar' })
  archiveType!: string;

  /**
   * Valor de source scope json mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_scope_json',
    type: 'json',
    columnType: 'jsonb',
  })
  sourceScopeJson!: unknown;

  /**
   * Identificador asociado a object manifest.
   */
  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de record count mantenido por la instancia.
   */
  @Property({ fieldName: 'record_count', type: 'bigint' })
  recordCount!: string;

  /**
   * Valor de manifest hash mantenido por la instancia.
   */
  @Property({ fieldName: 'manifest_hash', columnType: 'varchar' })
  manifestHash!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({ fieldName: 'verified_at', columnType: 'timestamptz' })
  verifiedAt!: Date;
}
