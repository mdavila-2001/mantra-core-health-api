import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Decisión de revisión sobre una revisión concreta de una ficha
 * (`data_catalog.catalog_review_decisions`). Append-only.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_review_decisions' })
export class CatalogReviewDecisions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'annotation_id', type: 'uuid' }) // FK → data_catalog.catalog_annotations
  annotationId!: string;

  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  /** APPROVED | REJECTED. */
  @Property({ columnType: 'varchar' })
  decision!: string;

  @Property({ columnType: 'text', nullable: true })
  comment?: string;

  @Property({ fieldName: 'reviewer_user_id', type: 'uuid' }) // FK → iam.users
  reviewerUserId!: string;

  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;
}
