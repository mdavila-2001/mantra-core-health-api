import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'transformation_definitions' })
export class TransformationDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  version!: string;

  @Property({ columnType: 'varchar' })
  engine!: string;

  @Property({ fieldName: 'source_dataset_ids', type: 'array' })
  sourceDatasetIds!: string[];

  @Property({ fieldName: 'target_dataset_id', type: 'uuid' })
  targetDatasetId!: string;

  @Property({ fieldName: 'transformation_ref', columnType: 'varchar' })
  transformationRef!: string;

  @Property({ columnType: 'varchar' })
  state!: string;
}
