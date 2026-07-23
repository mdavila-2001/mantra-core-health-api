import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'insight_query_runs' })
export class InsightQueryRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK (destino no resuelto)
  platformConnectionId!: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ fieldName: 'date_start', columnType: 'date', nullable: true })
  dateStart?: Date;

  @Property({ fieldName: 'date_end', columnType: 'date', nullable: true })
  dateEnd?: Date;

  @Property({
    fieldName: 'object_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  objectLevelConceptId?: string;

  @Property({
    fieldName: 'metric_codes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metricCodesJson?: unknown;

  @Property({
    fieldName: 'breakdown_codes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  breakdownCodesJson?: unknown;

  @Property({
    fieldName: 'filtering_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  filteringJson?: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'external_report_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalReportId?: string;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'row_count', type: 'bigint', nullable: true })
  rowCount?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
