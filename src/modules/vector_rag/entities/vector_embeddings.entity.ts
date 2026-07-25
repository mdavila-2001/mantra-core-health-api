import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'vector_embeddings' })
export class VectorEmbeddings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'vector_chunk_id', type: 'uuid' })
  vectorChunkId!: string;

  @Property({ fieldName: 'embedding_model_version_id', type: 'uuid' })
  embeddingModelVersionId!: string;

  @Property({ columnType: 'vector' })
  embedding!: string;

  @Property({ fieldName: 'embedding_hash', columnType: 'varchar' })
  embeddingHash!: string;

  @Property({ fieldName: 'generated_at', columnType: 'timestamptz' })
  generatedAt!: Date;

  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
