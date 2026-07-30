import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lakehouse_partitions`.
 */
@Entity({ schema: 'lakehouse', tableName: 'lakehouse_partitions' })
export class LakehousePartitions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a lakehouse dataset.
   */
  @Property({ fieldName: 'lakehouse_dataset_id', type: 'uuid' })
  lakehouseDatasetId!: string;

  /**
   * Valor de partition spec hash mantenido por la instancia.
   */
  @Property({ fieldName: 'partition_spec_hash', columnType: 'varchar' })
  partitionSpecHash!: string;

  /**
   * Valor de partition values json mantenido por la instancia.
   */
  @Property({
    fieldName: 'partition_values_json',
    type: 'json',
    columnType: 'jsonb',
  })
  partitionValuesJson!: unknown;

  /**
   * Valor de record count mantenido por la instancia.
   */
  @Property({ fieldName: 'record_count', type: 'bigint' })
  recordCount!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  /**
   * Valor de min event at mantenido por la instancia.
   */
  @Property({ fieldName: 'min_event_at', columnType: 'timestamptz' })
  minEventAt!: Date;

  /**
   * Valor de max event at mantenido por la instancia.
   */
  @Property({ fieldName: 'max_event_at', columnType: 'timestamptz' })
  maxEventAt!: Date;

  /**
   * Valor de state mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  state!: string;
}
