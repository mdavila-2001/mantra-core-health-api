import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'delivery_reconciliation_runs' })
export class DeliveryReconciliationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_channel_config_id', type: 'uuid' }) // FK → messaging.provider_channel_configs
  providerChannelConfigId!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'query_window_from', columnType: 'timestamptz' })
  queryWindowFrom!: Date;

  @Property({ fieldName: 'query_window_to', columnType: 'timestamptz' })
  queryWindowTo!: Date;

  @Property({ fieldName: 'deliveries_checked', type: 'bigint' })
  deliveriesChecked!: string;

  @Property({ fieldName: 'events_imported', type: 'bigint' })
  eventsImported!: string;

  @Property({ fieldName: 'inconsistencies_found', type: 'bigint' })
  inconsistenciesFound!: string;

  @Property({ fieldName: 'error_detail', columnType: 'text', nullable: true })
  errorDetail?: string;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
