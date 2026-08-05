import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dataset_connections`.
 */
@Entity({ schema: 'ads', tableName: 'dataset_connections' })
export class DatasetConnections {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a conversion dataset.
   */
  @Property({ fieldName: 'conversion_dataset_id', type: 'uuid' }) // FK → ads.conversion_datasets
  conversionDatasetId!: string;

  /**
   * Identificador asociado a platform connection.
   */
  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK → ads.ad_platform_connections
  platformConnectionId!: string;

  /**
   * Identificador asociado a tracking pixel.
   */
  @Property({ fieldName: 'tracking_pixel_id', type: 'uuid', nullable: true }) // FK → ads.tracking_pixels
  trackingPixelId?: string;

  /**
   * Identificador asociado a connection type concept.
   */
  @Property({ fieldName: 'connection_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  connectionTypeConceptId!: string;

  /**
   * Identificador asociado a external connection.
   */
  @Property({
    fieldName: 'external_connection_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalConnectionId?: string;

  /**
   * Identificador asociado a test event code secret.
   */
  @Property({
    fieldName: 'test_event_code_secret_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.encryption_keys
  testEventCodeSecretId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
