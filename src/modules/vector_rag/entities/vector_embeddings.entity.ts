import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `vector_embeddings`.
 */
@Entity({ schema: 'vector_rag', tableName: 'vector_embeddings' })
export class VectorEmbeddings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a vector chunk.
   */
  @Property({ fieldName: 'vector_chunk_id', type: 'uuid' })
  vectorChunkId!: string;

  /**
   * Identificador asociado a embedding model version.
   */
  @Property({ fieldName: 'embedding_model_version_id', type: 'uuid' })
  embeddingModelVersionId!: string;

  /**
   * Valor de embedding mantenido por la instancia.
   */
  @Property({ columnType: 'vector' })
  embedding!: string;

  /**
   * Valor de embedding hash mantenido por la instancia.
   */
  @Property({ fieldName: 'embedding_hash', columnType: 'varchar' })
  embeddingHash!: string;

  /**
   * Valor de generated at mantenido por la instancia.
   */
  @Property({ fieldName: 'generated_at', columnType: 'timestamptz' })
  generatedAt!: Date;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @Property({ fieldName: 'lifecycle_state', columnType: 'varchar' })
  lifecycleState!: string;
}
