import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `collection_ads`.
 */
@Entity({ schema: 'ads', tableName: 'collection_ads' })
export class CollectionAds {
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
   * Identificador asociado a layout concept.
   */
  @Property({ fieldName: 'layout_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  layoutConceptId!: string;

  /**
   * Identificador asociado a hero creative.
   */
  @Property({ fieldName: 'hero_creative_id', type: 'uuid', nullable: true }) // FK → ads.ad_creatives
  heroCreativeId?: string;

  /**
   * Identificador asociado a product set.
   */
  @Property({ fieldName: 'product_set_id', type: 'uuid', nullable: true }) // FK → ads.product_sets
  productSetId?: string;

  /**
   * Valor de instant experience json mantenido por la instancia.
   */
  @Property({
    fieldName: 'instant_experience_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  instantExperienceJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
