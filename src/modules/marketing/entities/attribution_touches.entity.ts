import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'attribution_touches' })
export class AttributionTouches {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'conversion_ref_type', columnType: 'varchar' })
  conversionRefType!: string;

  @Property({ fieldName: 'conversion_ref_id', type: 'uuid' })
  conversionRefId!: string;

  @Property({ fieldName: 'marketing_touchpoint_id', type: 'uuid' }) // FK → marketing.marketing_touchpoints
  marketingTouchpointId!: string;

  @Property({ fieldName: 'attribution_model_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  attributionModelConceptId!: string;

  @Property({ columnType: 'numeric' })
  weight!: string;

  @Property({
    fieldName: 'attributed_value',
    columnType: 'numeric',
    nullable: true,
  })
  attributedValue?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'position_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  positionConceptId?: string;

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
