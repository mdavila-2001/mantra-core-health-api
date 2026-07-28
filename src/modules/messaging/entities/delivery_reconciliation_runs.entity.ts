import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delivery_reconciliation_runs`.
 */
@Entity({ schema: 'messaging', tableName: 'delivery_reconciliation_runs' })
export class DeliveryReconciliationRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider channel config.
   */
  @Property({ fieldName: 'provider_channel_config_id', type: 'uuid' }) // FK → messaging.provider_channel_configs
  providerChannelConfigId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de query window from mantenido por la instancia.
   */
  @Property({ fieldName: 'query_window_from', columnType: 'timestamptz' })
  queryWindowFrom!: Date;

  /**
   * Valor de query window to mantenido por la instancia.
   */
  @Property({ fieldName: 'query_window_to', columnType: 'timestamptz' })
  queryWindowTo!: Date;

  /**
   * Valor de deliveries checked mantenido por la instancia.
   */
  @Property({ fieldName: 'deliveries_checked', type: 'bigint' })
  deliveriesChecked!: string;

  /**
   * Valor de events imported mantenido por la instancia.
   */
  @Property({ fieldName: 'events_imported', type: 'bigint' })
  eventsImported!: string;

  /**
   * Valor de inconsistencies found mantenido por la instancia.
   */
  @Property({ fieldName: 'inconsistencies_found', type: 'bigint' })
  inconsistenciesFound!: string;

  /**
   * Valor de error detail mantenido por la instancia.
   */
  @Property({ fieldName: 'error_detail', columnType: 'text', nullable: true })
  errorDetail?: string;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
