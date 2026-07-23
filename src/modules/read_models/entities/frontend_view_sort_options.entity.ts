import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'frontend_view_sort_options' })
export class FrontendViewSortOptions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  @Property({ fieldName: 'sort_code', columnType: 'varchar' })
  sortCode!: string;

  @Property({ columnType: 'varchar' })
  label!: string;

  @Property({ fieldName: 'sort_expression', columnType: 'varchar' })
  sortExpression!: string;

  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  @Property({ fieldName: 'nulls_position_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  nullsPositionConceptId!: string;

  @Property({
    fieldName: 'stable_tie_breaker_expression',
    columnType: 'varchar',
    nullable: true,
  })
  stableTieBreakerExpression?: string;

  @Property({ columnType: 'int' })
  ordinal!: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
