import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical_ext', tableName: 'order_set_items' })
export class OrderSetItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'order_set_id', type: 'uuid' }) // FK → clinical_ext.order_sets
  orderSetId!: string;

  @Property({ fieldName: 'item_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  itemTypeConceptId!: string;

  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  @Property({
    fieldName: 'default_dose_text',
    columnType: 'varchar',
    nullable: true,
  })
  defaultDoseText?: string;

  @Property({
    fieldName: 'default_route_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  defaultRouteConceptId?: string;

  @Property({
    fieldName: 'default_frequency_text',
    columnType: 'varchar',
    nullable: true,
  })
  defaultFrequencyText?: string;

  @Property({
    fieldName: 'is_selected_default',
    type: 'boolean',
    nullable: true,
  })
  isSelectedDefault?: boolean;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
