import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_review_events`.
 */
@Entity({ schema: 'ads', tableName: 'ad_review_events' })
export class AdReviewEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad.
   */
  @Property({ fieldName: 'ad_id', type: 'uuid' }) // FK → ads.ads
  adId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Identificador asociado a review event type concept.
   */
  @Property({ fieldName: 'review_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewEventTypeConceptId!: string;

  /**
   * Identificador asociado a review status concept.
   */
  @Property({ fieldName: 'review_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewStatusConceptId!: string;

  /**
   * Identificador asociado a external review.
   */
  @Property({
    fieldName: 'external_review_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalReviewId?: string;

  /**
   * Valor de reasons json mantenido por la instancia.
   */
  @Property({
    fieldName: 'reasons_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  reasonsJson?: unknown;

  /**
   * Valor de source payload hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_payload_hash',
    columnType: 'varchar',
    nullable: true,
  })
  sourcePayloadHash?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
