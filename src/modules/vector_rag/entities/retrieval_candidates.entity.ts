import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `retrieval_candidates`.
 */
@Entity({ schema: 'vector_rag', tableName: 'retrieval_candidates' })
export class RetrievalCandidates {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a retrieval session.
   */
  @Property({ fieldName: 'retrieval_session_id', type: 'uuid' })
  retrievalSessionId!: string;

  /**
   * Identificador asociado a vector chunk.
   */
  @Property({ fieldName: 'vector_chunk_id', type: 'uuid' })
  vectorChunkId!: string;

  /**
   * Valor de rank mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  rank!: number;

  /**
   * Valor de vector score mantenido por la instancia.
   */
  @Property({ fieldName: 'vector_score', columnType: 'double precision' })
  vectorScore!: number;

  /**
   * Valor de lexical score mantenido por la instancia.
   */
  @Property({ fieldName: 'lexical_score', columnType: 'double precision' })
  lexicalScore!: number;

  /**
   * Valor de reranker score mantenido por la instancia.
   */
  @Property({ fieldName: 'reranker_score', columnType: 'double precision' })
  rerankerScore!: number;

  /**
   * Valor de authorization decision mantenido por la instancia.
   */
  @Property({ fieldName: 'authorization_decision', columnType: 'varchar' })
  authorizationDecision!: string;

  /**
   * Valor de selected mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  selected!: boolean;
}
