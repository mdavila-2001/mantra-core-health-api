import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `feed_run_logs`.
 */
@Entity({ schema: 'ads', tableName: 'feed_run_logs' })
export class FeedRunLogs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a catalog feed.
   */
  @Property({ fieldName: 'catalog_feed_id', type: 'uuid' }) // FK → ads.catalog_feeds
  catalogFeedId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de items read mantenido por la instancia.
   */
  @Property({ fieldName: 'items_read', columnType: 'int', nullable: true })
  itemsRead?: number;

  /**
   * Valor de items upserted mantenido por la instancia.
   */
  @Property({ fieldName: 'items_upserted', columnType: 'int', nullable: true })
  itemsUpserted?: number;

  /**
   * Valor de items errored mantenido por la instancia.
   */
  @Property({ fieldName: 'items_errored', columnType: 'int', nullable: true })
  itemsErrored?: number;

  /**
   * Valor de error sample json mantenido por la instancia.
   */
  @Property({
    fieldName: 'error_sample_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  errorSampleJson?: unknown;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

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
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
