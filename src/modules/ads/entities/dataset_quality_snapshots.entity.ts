import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dataset_quality_snapshots`.
 */
@Entity({ schema: 'ads', tableName: 'dataset_quality_snapshots' })
export class DatasetQualitySnapshots {
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
   * Valor de measured at mantenido por la instancia.
   */
  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  /**
   * Valor de event match quality score mantenido por la instancia.
   */
  @Property({
    fieldName: 'event_match_quality_score',
    columnType: 'numeric(8,4)',
    nullable: true,
  })
  eventMatchQualityScore?: string;

  /**
   * Valor de deduplicated event percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'deduplicated_event_percent',
    columnType: 'numeric(8,4)',
    nullable: true,
  })
  deduplicatedEventPercent?: string;

  /**
   * Valor de rejected event percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'rejected_event_percent',
    columnType: 'numeric(8,4)',
    nullable: true,
  })
  rejectedEventPercent?: string;

  /**
   * Valor de freshness seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'freshness_seconds', type: 'bigint', nullable: true })
  freshnessSeconds?: string;

  /**
   * Valor de diagnostics json mantenido por la instancia.
   */
  @Property({
    fieldName: 'diagnostics_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  diagnosticsJson?: unknown;

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
}
