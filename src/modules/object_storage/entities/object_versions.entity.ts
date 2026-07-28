import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_versions`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_versions' })
export class ObjectVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a object manifest.
   */
  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a provider version.
   */
  @Property({ fieldName: 'provider_version_id', columnType: 'varchar' })
  providerVersionId!: string;

  /**
   * Valor de object key mantenido por la instancia.
   */
  @Property({ fieldName: 'object_key', columnType: 'varchar' })
  objectKey!: string;

  /**
   * Valor de mime type mantenido por la instancia.
   */
  @Property({ fieldName: 'mime_type', columnType: 'varchar' })
  mimeType!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  /**
   * Valor de sha256 mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  sha256!: string;

  /**
   * Valor de etag mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  etag!: string;

  /**
   * Valor de compression mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  compression!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a supersedes version.
   */
  @Property({ fieldName: 'supersedes_version_id', type: 'uuid' })
  supersedesVersionId!: string;
}
