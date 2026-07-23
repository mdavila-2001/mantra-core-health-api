import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'read_model_refresh_runs' })
export class ReadModelRefreshRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'read_model_definition_id', type: 'uuid' }) // FK → read_models.read_model_definitions
  readModelDefinitionId!: string;

  @Property({ fieldName: 'refresh_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  refreshTypeConceptId!: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'rows_affected', type: 'bigint', nullable: true })
  rowsAffected?: string;

  @Property({
    fieldName: 'source_watermark',
    columnType: 'varchar',
    nullable: true,
  })
  sourceWatermark?: string;

  @Property({ fieldName: 'result_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  resultConceptId?: string;

  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
