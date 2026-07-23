import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'pixel_events' })
export class PixelEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pixel_id', type: 'uuid' }) // FK (destino no resuelto)
  pixelId!: string;

  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  @Property({ fieldName: 'event_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventSourceConceptId!: string;

  @Property({
    fieldName: 'event_source_url',
    columnType: 'text',
    nullable: true,
  })
  eventSourceUrl?: string;

  @Property({
    fieldName: 'action_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  actionSourceConceptId?: string;

  @Property({
    fieldName: 'user_data_hash_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  userDataHashJson?: unknown;

  @Property({
    fieldName: 'custom_data_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  customDataJson?: unknown;

  @Property({
    fieldName: 'value_amount',
    columnType: 'numeric',
    nullable: true,
  })
  valueAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'event_id', columnType: 'varchar', nullable: true })
  eventId?: string;

  @Property({ fieldName: 'dedupe_key', columnType: 'varchar', nullable: true })
  dedupeKey?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
