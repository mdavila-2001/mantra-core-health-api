import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'feed_run_logs' })
export class FeedRunLogs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'catalog_feed_id', type: 'uuid' }) // FK → ads.catalog_feeds
  catalogFeedId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'items_read', columnType: 'int', nullable: true })
  itemsRead?: number;

  @Property({ fieldName: 'items_upserted', columnType: 'int', nullable: true })
  itemsUpserted?: number;

  @Property({ fieldName: 'items_errored', columnType: 'int', nullable: true })
  itemsErrored?: number;

  @Property({
    fieldName: 'error_sample_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  errorSampleJson?: unknown;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
