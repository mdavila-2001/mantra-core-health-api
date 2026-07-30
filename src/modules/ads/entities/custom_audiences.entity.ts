import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `custom_audiences`.
 */
@Entity({ schema: 'ads', tableName: 'custom_audiences' })
export class CustomAudiences {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a audience type concept.
   */
  @Property({ fieldName: 'audience_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  audienceTypeConceptId!: string;

  /**
   * Identificador asociado a subtype concept.
   */
  @Property({ fieldName: 'subtype_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  subtypeConceptId?: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  /**
   * Valor de rule json mantenido por la instancia.
   */
  @Property({
    fieldName: 'rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  ruleJson?: unknown;

  /**
   * Identificador asociado a lookalike source audience.
   */
  @Property({
    fieldName: 'lookalike_source_audience_id',
    type: 'uuid',
    nullable: true,
  }) // FK → ads.custom_audiences
  lookalikeSourceAudienceId?: string;

  /**
   * Valor de lookalike spec json mantenido por la instancia.
   */
  @Property({
    fieldName: 'lookalike_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  lookalikeSpecJson?: unknown;

  /**
   * Valor de approximate count mantenido por la instancia.
   */
  @Property({ fieldName: 'approximate_count', type: 'bigint', nullable: true })
  approximateCount?: string;

  /**
   * Identificador asociado a data source pixel.
   */
  @Property({ fieldName: 'data_source_pixel_id', type: 'uuid', nullable: true }) // FK → ads.tracking_pixels
  dataSourcePixelId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de external audience ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_audience_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalAudienceRef?: string;

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
