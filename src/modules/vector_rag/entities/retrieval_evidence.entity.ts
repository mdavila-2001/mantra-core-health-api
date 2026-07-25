import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'retrieval_evidence' })
export class RetrievalEvidence {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'retrieval_session_id', type: 'uuid' })
  retrievalSessionId!: string;

  @Property({ fieldName: 'vector_chunk_id', type: 'uuid' })
  vectorChunkId!: string;

  @Property({ fieldName: 'citation_number', columnType: 'int' })
  citationNumber!: number;

  @Property({ fieldName: 'quoted_text_redacted', columnType: 'text' })
  quotedTextRedacted!: string;

  @Property({ fieldName: 'source_uri', columnType: 'varchar' })
  sourceUri!: string;

  @Property({ fieldName: 'source_version_id', type: 'uuid' })
  sourceVersionId!: string;

  @Property({ fieldName: 'evidence_hash', columnType: 'varchar' })
  evidenceHash!: string;
}
