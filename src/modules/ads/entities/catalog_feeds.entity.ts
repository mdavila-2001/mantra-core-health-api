import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_feeds`.
 */
@Entity({ schema: 'ads', tableName: 'catalog_feeds' })
export class CatalogFeeds {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a product catalog.
   */
  @Property({ fieldName: 'product_catalog_id', type: 'uuid' }) // FK → ads.product_catalogs
  productCatalogId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a feed source concept.
   */
  @Property({ fieldName: 'feed_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  feedSourceConceptId!: string;

  /**
   * Valor de feed url mantenido por la instancia.
   */
  @Property({ fieldName: 'feed_url', columnType: 'text', nullable: true })
  feedUrl?: string;

  /**
   * Valor de schedule cron mantenido por la instancia.
   */
  @Property({
    fieldName: 'schedule_cron',
    columnType: 'varchar',
    nullable: true,
  })
  scheduleCron?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Valor de last run at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

  /**
   * Identificador asociado a last status concept.
   */
  @Property({
    fieldName: 'last_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lastStatusConceptId?: string;

  /**
   * Valor de total items mantenido por la instancia.
   */
  @Property({ fieldName: 'total_items', columnType: 'int', nullable: true })
  totalItems?: number;

  /**
   * Valor de error count mantenido por la instancia.
   */
  @Property({ fieldName: 'error_count', columnType: 'int', nullable: true })
  errorCount?: number;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
