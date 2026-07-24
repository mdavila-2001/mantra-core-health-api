import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'embedding_model_versions' })
export class EmbeddingModelVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_code', columnType: 'varchar' })
  providerCode!: string;

  @Property({ fieldName: 'model_id', columnType: 'varchar' })
  modelId!: string;

  @Property({ fieldName: 'model_version', columnType: 'varchar' })
  modelVersion!: string;

  @Property({ columnType: 'int' })
  dimension!: number;

  @Property({ fieldName: 'distance_metric', columnType: 'varchar' })
  distanceMetric!: string;

  @Property({ fieldName: 'tokenizer_version', columnType: 'varchar' })
  tokenizerVersion!: string;

  @Property({ fieldName: 'approved_for_phi', type: 'boolean' })
  approvedForPhi!: boolean;

  @Property({ fieldName: 'approved_at', columnType: 'timestamptz' })
  approvedAt!: Date;

  @Property({ fieldName: 'retired_at', columnType: 'timestamptz' })
  retiredAt!: Date;
}
