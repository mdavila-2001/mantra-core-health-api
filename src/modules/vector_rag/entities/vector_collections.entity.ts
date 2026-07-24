import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'vector_collections' })
export class VectorCollections {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ columnType: 'int' })
  dimension!: number;

  @Property({ fieldName: 'distance_metric', columnType: 'varchar' })
  distanceMetric!: string;

  @Property({ fieldName: 'embedding_model_version_id', type: 'uuid' })
  embeddingModelVersionId!: string;

  @Property({ fieldName: 'contains_phi', type: 'boolean' })
  containsPhi!: boolean;

  @Property({ fieldName: 'access_policy_id', type: 'uuid' })
  accessPolicyId!: string;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
