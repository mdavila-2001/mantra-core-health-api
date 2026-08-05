import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversion_attributions`.
 */
@Entity({ schema: 'ads', tableName: 'conversion_attributions' })
export class ConversionAttributions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pixel event.
   */
  @Property({ fieldName: 'pixel_event_id', type: 'uuid' }) // FK → ads.pixel_events
  pixelEventId!: string;

  /**
   * Identificador asociado a ad ref.
   */
  @Property({ fieldName: 'ad_ref_id', type: 'uuid', nullable: true })
  adRefId?: string;

  /**
   * Identificador asociado a campaign ref.
   */
  @Property({ fieldName: 'campaign_ref_id', type: 'uuid', nullable: true })
  campaignRefId?: string;

  /**
   * Identificador asociado a attribution type concept.
   */
  @Property({ fieldName: 'attribution_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  attributionTypeConceptId!: string;

  /**
   * Valor de attributed value mantenido por la instancia.
   */
  @Property({
    fieldName: 'attributed_value',
    columnType: 'numeric',
    nullable: true,
  })
  attributedValue?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de attributed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'attributed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  attributedAt?: Date;

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
