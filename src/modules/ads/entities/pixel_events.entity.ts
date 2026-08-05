import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pixel_events`.
 */
@Entity({ schema: 'ads', tableName: 'pixel_events' })
export class PixelEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pixel.
   */
  @Property({ fieldName: 'pixel_id', type: 'uuid' }) // FK → ads.tracking_pixels
  pixelId!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Identificador asociado a event source concept.
   */
  @Property({ fieldName: 'event_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventSourceConceptId!: string;

  /**
   * Valor de event source url mantenido por la instancia.
   */
  @Property({
    fieldName: 'event_source_url',
    columnType: 'text',
    nullable: true,
  })
  eventSourceUrl?: string;

  /**
   * Identificador asociado a action source concept.
   */
  @Property({
    fieldName: 'action_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  actionSourceConceptId?: string;

  /**
   * Valor de user data hash json mantenido por la instancia.
   */
  @Property({
    fieldName: 'user_data_hash_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  userDataHashJson?: unknown;

  /**
   * Valor de custom data json mantenido por la instancia.
   */
  @Property({
    fieldName: 'custom_data_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  customDataJson?: unknown;

  /**
   * Valor de value amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_amount',
    columnType: 'numeric',
    nullable: true,
  })
  valueAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a event.
   */
  @Property({ fieldName: 'event_id', columnType: 'varchar', nullable: true })
  eventId?: string;

  /**
   * Valor de dedupe key mantenido por la instancia.
   */
  @Property({ fieldName: 'dedupe_key', columnType: 'varchar', nullable: true })
  dedupeKey?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

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
