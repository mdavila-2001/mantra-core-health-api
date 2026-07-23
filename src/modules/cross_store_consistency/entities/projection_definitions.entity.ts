import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_definitions',
})
export class ProjectionDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'source_dataset_id', type: 'uuid' })
  sourceDatasetId!: string;

  @Property({ fieldName: 'target_dataset_id', type: 'uuid' })
  targetDatasetId!: string;

  @Property({ fieldName: 'projection_version', columnType: 'varchar' })
  projectionVersion!: string;

  @Property({ fieldName: 'delivery_semantics', columnType: 'varchar' })
  deliverySemantics!: string;

  @Property({ fieldName: 'transformation_ref', columnType: 'varchar' })
  transformationRef!: string;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
