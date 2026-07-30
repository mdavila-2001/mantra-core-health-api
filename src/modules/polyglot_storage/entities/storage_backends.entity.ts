import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `storage_backends`.
 */
@Entity({ schema: 'polyglot_storage', tableName: 'storage_backends' })
export class StorageBackends {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de backend type mantenido por la instancia.
   */
  @Property({ fieldName: 'backend_type', columnType: 'varchar' })
  backendType!: string;

  /**
   * Valor de provider code mantenido por la instancia.
   */
  @Property({ fieldName: 'provider_code', columnType: 'varchar' })
  providerCode!: string;

  /**
   * Valor de control plane endpoint mantenido por la instancia.
   */
  @Property({ fieldName: 'control_plane_endpoint', columnType: 'varchar' })
  controlPlaneEndpoint!: string;

  /**
   * Valor de supports transactions mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_transactions', type: 'boolean' })
  supportsTransactions!: boolean;

  /**
   * Valor de supports ttl mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_ttl', type: 'boolean' })
  supportsTtl!: boolean;

  /**
   * Valor de supports encryption mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_encryption', type: 'boolean' })
  supportsEncryption!: boolean;

  /**
   * Valor de supports versioning mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_versioning', type: 'boolean' })
  supportsVersioning!: boolean;

  /**
   * Valor de supports worm mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_worm', type: 'boolean' })
  supportsWorm!: boolean;

  /**
   * Valor de supports vector search mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_vector_search', type: 'boolean' })
  supportsVectorSearch!: boolean;

  /**
   * Valor de supports full text mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_full_text', type: 'boolean' })
  supportsFullText!: boolean;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;

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
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
