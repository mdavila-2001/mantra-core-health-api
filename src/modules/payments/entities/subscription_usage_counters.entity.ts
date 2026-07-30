import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `subscription_usage_counters`.
 */
@Entity({ schema: 'payments', tableName: 'subscription_usage_counters' })
export class SubscriptionUsageCounters {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a subscription.
   */
  @Property({ fieldName: 'subscription_id', type: 'uuid' }) // FK → payments.subscriptions
  subscriptionId!: string;

  /**
   * Identificador asociado a metric concept.
   */
  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @Property({ fieldName: 'period_start', columnType: 'timestamptz' })
  periodStart!: Date;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @Property({ fieldName: 'period_end', columnType: 'timestamptz' })
  periodEnd!: Date;

  /**
   * Valor de used value mantenido por la instancia.
   */
  @Property({ fieldName: 'used_value', columnType: 'numeric', nullable: true })
  usedValue?: string;

  /**
   * Valor de limit value mantenido por la instancia.
   */
  @Property({ fieldName: 'limit_value', columnType: 'numeric', nullable: true })
  limitValue?: string;

  /**
   * Valor de last event at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_event_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastEventAt?: Date;

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

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
