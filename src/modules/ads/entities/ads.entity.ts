import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ads`.
 */
@Entity({ schema: 'ads', tableName: 'ads' })
export class Ads {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad set.
   */
  @Property({ fieldName: 'ad_set_id', type: 'uuid' }) // FK → ads.ad_sets
  adSetId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a creative.
   */
  @Property({ fieldName: 'creative_id', type: 'uuid' }) // FK → ads.ad_creatives
  creativeId!: string;

  /**
   * Valor de tracking specs json mantenido por la instancia.
   */
  @Property({
    fieldName: 'tracking_specs_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  trackingSpecsJson?: unknown;

  /**
   * Valor de conversion domain mantenido por la instancia.
   */
  @Property({
    fieldName: 'conversion_domain',
    columnType: 'varchar',
    nullable: true,
  })
  conversionDomain?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a effective status concept.
   */
  @Property({
    fieldName: 'effective_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  effectiveStatusConceptId?: string;

  /**
   * Valor de review feedback json mantenido por la instancia.
   */
  @Property({
    fieldName: 'review_feedback_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  reviewFeedbackJson?: unknown;

  /**
   * Valor de external ad ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_ad_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalAdRef?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
