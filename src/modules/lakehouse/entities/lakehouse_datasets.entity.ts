import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_datasets`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_datasets' })
export class LakehouseDatasets {
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
   * Identificador asociado a data product version.
   */
  @Property({ fieldName: 'data_product_version_id', type: 'uuid' })
  dataProductVersionId!: string;

  /**
   * Identificador asociado a data lake zone.
   */
  @Property({ fieldName: 'data_lake_zone_id', type: 'uuid' })
  dataLakeZoneId!: string;

  /**
   * Identificador asociado a lakehouse catalog.
   */
  @Property({ fieldName: 'lakehouse_catalog_id', type: 'uuid' })
  lakehouseCatalogId!: string;

  /**
   * Valor de database name mantenido por la instancia.
   */
  @Property({ fieldName: 'database_name', columnType: 'varchar' })
  databaseName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @Property({ fieldName: 'table_name', columnType: 'varchar' })
  tableName!: string;

  /**
   * Valor de storage format mantenido por la instancia.
   */
  @Property({ fieldName: 'storage_format', columnType: 'varchar' })
  storageFormat!: string;

  /**
   * Valor de partition spec json mantenido por la instancia.
   */
  @Property({
    fieldName: 'partition_spec_json',
    type: 'json',
    columnType: 'jsonb',
  })
  partitionSpecJson!: unknown;

  /**
   * Valor de source dataset code mantenido por la instancia.
   */
  @Property({ fieldName: 'source_dataset_code', columnType: 'varchar' })
  sourceDatasetCode!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
