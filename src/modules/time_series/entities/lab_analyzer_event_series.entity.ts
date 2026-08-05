import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `lab_analyzer_event_series`.
 */
@Entity({ schema: 'time_series', tableName: 'lab_analyzer_event_series' })
export class LabAnalyzerEventSeries {
  /**
   * Valor de time mantenido por la instancia.
   */
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  /**
   * Identificador asociado a tenant.
   */
  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a series.
   */
  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  /**
   * Valor de quality state mantenido por la instancia.
   */
  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  /**
   * Identificador asociado a analyzer.
   */
  @Property({ fieldName: 'analyzer_id', type: 'uuid' })
  analyzerId!: string;

  /**
   * Identificador asociado a accession.
   */
  @Property({ fieldName: 'accession_id', type: 'uuid' })
  accessionId!: string;

  /**
   * Valor de event code mantenido por la instancia.
   */
  @Property({ fieldName: 'event_code', columnType: 'varchar' })
  eventCode!: string;

  /**
   * Valor de test code mantenido por la instancia.
   */
  @Property({ fieldName: 'test_code', columnType: 'varchar', nullable: true })
  testCode?: string;

  /**
   * Valor de numeric value mantenido por la instancia.
   */
  @Property({
    fieldName: 'numeric_value',
    columnType: 'double precision',
    nullable: true,
  })
  numericValue?: number;

  /**
   * Valor de unit code mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_code', columnType: 'varchar', nullable: true })
  unitCode?: string;

  /**
   * Valor de details mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  details?: unknown;
}
