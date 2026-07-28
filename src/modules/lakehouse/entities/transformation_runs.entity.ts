import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `transformation_runs`.
 */
@Entity({ schema: 'lakehouse', tableName: 'transformation_runs' })
export class TransformationRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a transformation definition.
   */
  @Property({ fieldName: 'transformation_definition_id', type: 'uuid' })
  transformationDefinitionId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Valor de source checkpoint mantenido por la instancia.
   */
  @Property({ fieldName: 'source_checkpoint', columnType: 'varchar' })
  sourceCheckpoint!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de input record count mantenido por la instancia.
   */
  @Property({ fieldName: 'input_record_count', type: 'bigint' })
  inputRecordCount!: string;

  /**
   * Valor de output record count mantenido por la instancia.
   */
  @Property({ fieldName: 'output_record_count', type: 'bigint' })
  outputRecordCount!: string;

  /**
   * Valor de rejected record count mantenido por la instancia.
   */
  @Property({ fieldName: 'rejected_record_count', type: 'bigint' })
  rejectedRecordCount!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
