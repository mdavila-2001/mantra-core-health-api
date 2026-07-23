import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'lakehouse_datasets' })
export class LakehouseDatasets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'data_product_version_id', type: 'uuid' })
  dataProductVersionId!: string;

  @Property({ fieldName: 'data_lake_zone_id', type: 'uuid' })
  dataLakeZoneId!: string;

  @Property({ fieldName: 'lakehouse_catalog_id', type: 'uuid' })
  lakehouseCatalogId!: string;

  @Property({ fieldName: 'database_name', columnType: 'varchar' })
  databaseName!: string;

  @Property({ fieldName: 'table_name', columnType: 'varchar' })
  tableName!: string;

  @Property({ fieldName: 'storage_format', columnType: 'varchar' })
  storageFormat!: string;

  @Property({
    fieldName: 'partition_spec_json',
    type: 'json',
    columnType: 'jsonb',
  })
  partitionSpecJson!: unknown;

  @Property({ fieldName: 'source_dataset_code', columnType: 'varchar' })
  sourceDatasetCode!: string;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
