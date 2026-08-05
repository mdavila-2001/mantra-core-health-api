import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insight_fact_rows`.
 */
@Entity({ schema: 'ads', tableName: 'insight_fact_rows' })
export class InsightFactRows {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insight query run.
   */
  @Property({ fieldName: 'insight_query_run_id', type: 'uuid' }) // FK → ads.insight_query_runs
  insightQueryRunId!: string;

  /**
   * Valor de fact date mantenido por la instancia.
   */
  @Property({ fieldName: 'fact_date', columnType: 'date' })
  factDate!: Date;

  /**
   * Identificador asociado a object type concept.
   */
  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  /**
   * Identificador asociado a external object.
   */
  @Property({ fieldName: 'external_object_id', columnType: 'varchar' })
  externalObjectId!: string;

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  /**
   * Identificador asociado a ad set.
   */
  @Property({ fieldName: 'ad_set_id', type: 'uuid', nullable: true }) // FK → ads.ad_sets
  adSetId?: string;

  /**
   * Identificador asociado a ad.
   */
  @Property({ fieldName: 'ad_id', type: 'uuid', nullable: true }) // FK → ads.ads
  adId?: string;

  /**
   * Valor de dimensions json mantenido por la instancia.
   */
  @Property({
    fieldName: 'dimensions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  dimensionsJson?: unknown;

  /**
   * Valor de metrics json mantenido por la instancia.
   */
  @Property({ fieldName: 'metrics_json', type: 'json', columnType: 'jsonb' })
  metricsJson!: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
