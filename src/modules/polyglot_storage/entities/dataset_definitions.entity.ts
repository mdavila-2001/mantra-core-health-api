import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'dataset_definitions' })
export class DatasetDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'owning_module_code', columnType: 'varchar' })
  owningModuleCode!: string;

  @Property({ fieldName: 'data_classification_id', type: 'uuid' }) // FK (destino no resuelto)
  dataClassificationId!: string;

  @Property({ fieldName: 'source_of_truth', columnType: 'varchar' })
  sourceOfTruth!: string;

  @Property({ fieldName: 'canonical_entity_type', columnType: 'varchar' })
  canonicalEntityType!: string;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
