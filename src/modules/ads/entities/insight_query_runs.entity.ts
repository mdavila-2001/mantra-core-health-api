import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insight_query_runs`.
 */
@Entity({ schema: 'ads', tableName: 'insight_query_runs' })
export class InsightQueryRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Identificador asociado a platform connection.
   */
  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK → ads.ad_platform_connections
  platformConnectionId!: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Valor de date start mantenido por la instancia.
   */
  @Property({ fieldName: 'date_start', columnType: 'date', nullable: true })
  dateStart?: Date;

  /**
   * Valor de date end mantenido por la instancia.
   */
  @Property({ fieldName: 'date_end', columnType: 'date', nullable: true })
  dateEnd?: Date;

  /**
   * Identificador asociado a object level concept.
   */
  @Property({
    fieldName: 'object_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  objectLevelConceptId?: string;

  /**
   * Valor de metric codes json mantenido por la instancia.
   */
  @Property({
    fieldName: 'metric_codes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metricCodesJson?: unknown;

  /**
   * Valor de breakdown codes json mantenido por la instancia.
   */
  @Property({
    fieldName: 'breakdown_codes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  breakdownCodesJson?: unknown;

  /**
   * Valor de filtering json mantenido por la instancia.
   */
  @Property({
    fieldName: 'filtering_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filteringJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a external report.
   */
  @Property({
    fieldName: 'external_report_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalReportId?: string;

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
   * Valor de row count mantenido por la instancia.
   */
  @Property({ fieldName: 'row_count', type: 'bigint', nullable: true })
  rowCount?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
