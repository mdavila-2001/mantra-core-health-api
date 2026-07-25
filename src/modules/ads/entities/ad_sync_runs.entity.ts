import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_sync_runs' })
export class AdSyncRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK → ads.ad_platform_connections
  platformConnectionId!: string;

  @Property({ fieldName: 'sync_direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  syncDirectionConceptId!: string;

  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'objects_read', type: 'bigint', nullable: true })
  objectsRead?: string;

  @Property({ fieldName: 'objects_written', type: 'bigint', nullable: true })
  objectsWritten?: string;

  @Property({ fieldName: 'objects_failed', type: 'bigint', nullable: true })
  objectsFailed?: string;

  @Property({
    fieldName: 'error_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  errorSummaryJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
