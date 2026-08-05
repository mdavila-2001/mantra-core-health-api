import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `review_dimension_scores`.
 */
@Entity({ schema: 'community', tableName: 'review_dimension_scores' })
export class ReviewDimensionScores {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a review.
   */
  @Property({ fieldName: 'review_id', type: 'uuid' }) // FK → community.service_reviews
  reviewId!: string;

  /**
   * Identificador asociado a dimension concept.
   */
  @Property({ fieldName: 'dimension_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dimensionConceptId!: string;

  /**
   * Valor de score mantenido por la instancia.
   */
  @Property({ columnType: 'smallint' })
  score!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
