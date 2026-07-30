import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversion_event_deduplication`.
 */
@Entity({ schema: 'ads', tableName: 'conversion_event_deduplication' })
export class ConversionEventDeduplication {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a conversion dataset.
   */
  @Property({ fieldName: 'conversion_dataset_id', type: 'uuid' }) // FK → ads.conversion_datasets
  conversionDatasetId!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Identificador asociado a event.
   */
  @Property({ fieldName: 'event_id', columnType: 'varchar' })
  eventId!: string;

  /**
   * Valor de browser event reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'browser_event_reference',
    columnType: 'varchar',
    nullable: true,
  })
  browserEventReference?: string;

  /**
   * Identificador asociado a server conversion event.
   */
  @Property({
    fieldName: 'server_conversion_event_id',
    type: 'uuid',
    nullable: true,
  }) // FK → ads.server_conversion_events
  serverConversionEventId?: string;

  /**
   * Valor de first seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'first_seen_at', columnType: 'timestamptz' })
  firstSeenAt!: Date;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSeenAt?: Date;

  /**
   * Valor de duplicate count mantenido por la instancia.
   */
  @Property({ fieldName: 'duplicate_count', columnType: 'int' })
  duplicateCount!: number;

  /**
   * Identificador asociado a resolution concept.
   */
  @Property({ fieldName: 'resolution_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resolutionConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
