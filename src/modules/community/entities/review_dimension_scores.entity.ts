import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'review_dimension_scores' })
export class ReviewDimensionScores {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'review_id', type: 'uuid' })  // FK → community.service_reviews
  reviewId!: string;

  @Property({ fieldName: 'dimension_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  dimensionConceptId!: string;

  @Property({ columnType: 'smallint' })
  score!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

}
