import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dataset_release_manifests`.
 */
@Entity({ schema: 'lakehouse', tableName: 'dataset_release_manifests' })
export class DatasetReleaseManifests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dataset release request.
   */
  @Property({ fieldName: 'dataset_release_request_id', type: 'uuid' })
  datasetReleaseRequestId!: string;

  /**
   * Identificador asociado a deidentification run.
   */
  @Property({ fieldName: 'deidentification_run_id', type: 'uuid' })
  deidentificationRunId!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_version', columnType: 'varchar' })
  schemaVersion!: string;

  /**
   * Valor de record count mantenido por la instancia.
   */
  @Property({ fieldName: 'record_count', type: 'bigint' })
  recordCount!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
