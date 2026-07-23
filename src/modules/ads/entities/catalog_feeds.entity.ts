import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'catalog_feeds' })
export class CatalogFeeds {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'product_catalog_id', type: 'uuid' }) // FK → ads.product_catalogs
  productCatalogId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'feed_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  feedSourceConceptId!: string;

  @Property({ fieldName: 'feed_url', columnType: 'text', nullable: true })
  feedUrl?: string;

  @Property({
    fieldName: 'schedule_cron',
    columnType: 'varchar',
    nullable: true,
  })
  scheduleCron?: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

  @Property({
    fieldName: 'last_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lastStatusConceptId?: string;

  @Property({ fieldName: 'total_items', columnType: 'int', nullable: true })
  totalItems?: number;

  @Property({ fieldName: 'error_count', columnType: 'int', nullable: true })
  errorCount?: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
