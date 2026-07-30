import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_files`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_files' })
export class LakehouseFiles {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a lakehouse partition.
   */
  @Property({ fieldName: 'lakehouse_partition_id', type: 'uuid' })
  lakehousePartitionId!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de file format mantenido por la instancia.
   */
  @Property({ fieldName: 'file_format', columnType: 'varchar' })
  fileFormat!: string;

  /**
   * Valor de row count mantenido por la instancia.
   */
  @Property({ fieldName: 'row_count', type: 'bigint' })
  rowCount!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de min max statistics json mantenido por la instancia.
   */
  @Property({
    fieldName: 'min_max_statistics_json',
    type: 'json',
    columnType: 'jsonb',
  })
  minMaxStatisticsJson!: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
