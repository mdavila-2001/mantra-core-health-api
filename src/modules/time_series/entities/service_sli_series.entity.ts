import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `service_sli_series`.
 */
@Entity({ schema: 'time_series', tableName: 'service_sli_series' })
export class ServiceSliSeries {
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
   * Identificador asociado a service.
   */
  @Property({ fieldName: 'service_id', type: 'uuid' })
  serviceId!: string;

  /**
   * Valor de sli code mantenido por la instancia.
   */
  @Property({ fieldName: 'sli_code', columnType: 'varchar' })
  sliCode!: string;

  /**
   * Valor de numerator mantenido por la instancia.
   */
  @Property({ columnType: 'double precision' })
  numerator!: number;

  /**
   * Valor de denominator mantenido por la instancia.
   */
  @Property({ columnType: 'double precision' })
  denominator!: number;

  /**
   * Valor de value mantenido por la instancia.
   */
  @Property({ columnType: 'double precision' })
  value!: number;

  /**
   * Valor de region code mantenido por la instancia.
   */
  @Property({ fieldName: 'region_code', columnType: 'varchar', nullable: true })
  regionCode?: string;

  /**
   * Valor de dimensions mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
