import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `payment_gateway_metric_series`.
 */
@Entity({ schema: 'time_series', tableName: 'payment_gateway_metric_series' })
export class PaymentGatewayMetricSeries {
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
   * Identificador asociado a gateway.
   */
  @Property({ fieldName: 'gateway_id', type: 'uuid' })
  gatewayId!: string;

  /**
   * Valor de operation code mantenido por la instancia.
   */
  @Property({ fieldName: 'operation_code', columnType: 'varchar' })
  operationCode!: string;

  /**
   * Valor de metric code mantenido por la instancia.
   */
  @Property({ fieldName: 'metric_code', columnType: 'varchar' })
  metricCode!: string;

  /**
   * Valor de metric value mantenido por la instancia.
   */
  @Property({ fieldName: 'metric_value', columnType: 'double precision' })
  metricValue!: number;

  /**
   * Identificador asociado a payment transaction.
   */
  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  })
  paymentTransactionId?: string;

  /**
   * Valor de dimensions mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
