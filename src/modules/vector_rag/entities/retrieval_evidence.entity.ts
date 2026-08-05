import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `retrieval_evidence`.
 */
@Entity({ schema: 'vector_rag', tableName: 'retrieval_evidence' })
export class RetrievalEvidence {
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
   * Valor de citation number mantenido por la instancia.
   */
  @Property({ fieldName: 'citation_number', columnType: 'int' })
  citationNumber!: number;

  /**
   * Valor de quoted text redacted mantenido por la instancia.
   */
  @Property({ fieldName: 'quoted_text_redacted', columnType: 'text' })
  quotedTextRedacted!: string;

  /**
   * Valor de source uri mantenido por la instancia.
   */
  @Property({ fieldName: 'source_uri', columnType: 'varchar' })
  sourceUri!: string;

  /**
   * Identificador asociado a source version.
   */
  @Property({ fieldName: 'source_version_id', type: 'uuid' })
  sourceVersionId!: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @Property({ fieldName: 'evidence_hash', columnType: 'varchar' })
  evidenceHash!: string;
}
