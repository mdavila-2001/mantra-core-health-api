import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'payment_gateway_metric_series' })
export class PaymentGatewayMetricSeries {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  @Property({ fieldName: 'gateway_id', type: 'uuid' })
  gatewayId!: string;

  @Property({ fieldName: 'operation_code', columnType: 'varchar' })
  operationCode!: string;

  @Property({ fieldName: 'metric_code', columnType: 'varchar' })
  metricCode!: string;

  @Property({ fieldName: 'metric_value', columnType: 'double precision' })
  metricValue!: number;

  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  })
  paymentTransactionId?: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
