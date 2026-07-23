import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'dataset_connections' })
export class DatasetConnections {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'conversion_dataset_id', type: 'uuid' }) // FK → ads.conversion_datasets
  conversionDatasetId!: string;

  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK (destino no resuelto)
  platformConnectionId!: string;

  @Property({ fieldName: 'tracking_pixel_id', type: 'uuid', nullable: true }) // FK → ads.tracking_pixels
  trackingPixelId?: string;

  @Property({ fieldName: 'connection_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  connectionTypeConceptId!: string;

  @Property({
    fieldName: 'external_connection_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalConnectionId?: string;

  @Property({
    fieldName: 'test_event_code_secret_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  testEventCodeSecretId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
