import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `bulk_import_batch_rows`.
 */
@Entity({ schema: 'system_ops', tableName: 'bulk_import_batch_rows' })
export class BulkImportBatchRows {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a batch.
   */
  @Property({ fieldName: 'batch_id', type: 'uuid' }) // FK (destino no resuelto)
  batchId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  /**
   * Valor de row no mantenido por la instancia.
   */
  @Property({ fieldName: 'row_no', columnType: 'int' })
  rowNo!: number;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  outcome?: string;

  /**
   * Valor de reason code mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_code', columnType: 'varchar', nullable: true })
  reasonCode?: string;

  /**
   * Valor de field name mantenido por la instancia.
   */
  @Property({ fieldName: 'field_name', columnType: 'varchar', nullable: true })
  fieldName?: string;

  /**
   * Valor de target entity mantenido por la instancia.
   */
  @Property({
    fieldName: 'target_entity',
    columnType: 'varchar',
    nullable: true,
  })
  targetEntity?: string;

  /**
   * Identificador asociado a target.
   */
  @Property({ fieldName: 'target_id', type: 'uuid', nullable: true })
  targetId?: string;

  /**
   * Valor de processed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'processed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  processedAt?: Date;

  /**
   * Valor de row key mantenido por la instancia.
   */
  @Property({ fieldName: 'row_key', columnType: 'varchar(64)', nullable: true })
  rowKey?: string;

  /**
   * Valor de row data json mantenido por la instancia.
   */
  @Property({
    fieldName: 'row_data_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  rowDataJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
