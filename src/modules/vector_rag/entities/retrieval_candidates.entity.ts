import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'retrieval_candidates' })
export class RetrievalCandidates {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'retrieval_session_id', type: 'uuid' })
  retrievalSessionId!: string;

  @Property({ fieldName: 'vector_chunk_id', type: 'uuid' })
  vectorChunkId!: string;

  @Property({ columnType: 'int' })
  rank!: number;

  @Property({ fieldName: 'vector_score', columnType: 'double precision' })
  vectorScore!: number;

  @Property({ fieldName: 'lexical_score', columnType: 'double precision' })
  lexicalScore!: number;

  @Property({ fieldName: 'reranker_score', columnType: 'double precision' })
  rerankerScore!: number;

  @Property({ fieldName: 'authorization_decision', columnType: 'varchar' })
  authorizationDecision!: string;

  @Property({ type: 'boolean' })
  selected!: boolean;
}
