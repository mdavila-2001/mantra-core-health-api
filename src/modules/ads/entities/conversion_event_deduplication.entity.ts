import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'conversion_event_deduplication' })
export class ConversionEventDeduplication {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'conversion_dataset_id', type: 'uuid' }) // FK → ads.conversion_datasets
  conversionDatasetId!: string;

  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  @Property({ fieldName: 'event_id', columnType: 'varchar' })
  eventId!: string;

  @Property({
    fieldName: 'browser_event_reference',
    columnType: 'varchar',
    nullable: true,
  })
  browserEventReference?: string;

  @Property({
    fieldName: 'server_conversion_event_id',
    type: 'uuid',
    nullable: true,
  }) // FK → ads.server_conversion_events
  serverConversionEventId?: string;

  @Property({ fieldName: 'first_seen_at', columnType: 'timestamptz' })
  firstSeenAt!: Date;

  @Property({
    fieldName: 'last_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSeenAt?: Date;

  @Property({ fieldName: 'duplicate_count', columnType: 'int' })
  duplicateCount!: number;

  @Property({ fieldName: 'resolution_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resolutionConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
