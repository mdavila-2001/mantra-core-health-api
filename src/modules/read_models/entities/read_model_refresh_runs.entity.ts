import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `read_model_refresh_runs`.
 */
@Entity({ schema: 'read_models', tableName: 'read_model_refresh_runs' })
export class ReadModelRefreshRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a read model definition.
   */
  @Property({ fieldName: 'read_model_definition_id', type: 'uuid' }) // FK → read_models.read_model_definitions
  readModelDefinitionId!: string;

  /**
   * Identificador asociado a refresh type concept.
   */
  @Property({ fieldName: 'refresh_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  refreshTypeConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de rows affected mantenido por la instancia.
   */
  @Property({ fieldName: 'rows_affected', type: 'bigint', nullable: true })
  rowsAffected?: string;

  /**
   * Valor de source watermark mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_watermark',
    columnType: 'varchar',
    nullable: true,
  })
  sourceWatermark?: string;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  resultConceptId?: string;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
