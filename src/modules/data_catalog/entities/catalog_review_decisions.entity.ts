import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_review_decisions`.
 */
@Entity({ schema: 'data_catalog', tableName: 'catalog_review_decisions' })
export class CatalogReviewDecisions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a annotation.
   */
  @Property({ fieldName: 'annotation_id', type: 'uuid' }) // FK → data_catalog.catalog_annotations
  annotationId!: string;

  /**
   * Valor de revision no mantenido por la instancia.
   */
  @Property({ fieldName: 'revision_no', columnType: 'int' })
  revisionNo!: number;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  decision!: string;

  /**
   * Valor de comment mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  comment?: string;

  /**
   * Identificador asociado a reviewer user.
   */
  @Property({ fieldName: 'reviewer_user_id', type: 'uuid' }) // FK → iam.users (inferida)
  reviewerUserId!: string;

  /**
   * Valor de decided at mantenido por la instancia.
   */
  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;
}
