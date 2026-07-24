import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'vector_rag', tableName: 'vector_chunks' })
export class VectorChunks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'vector_document_id', type: 'uuid' })
  vectorDocumentId!: string;

  @Property({ fieldName: 'chunk_number', columnType: 'int' })
  chunkNumber!: number;

  @Property({ fieldName: 'chunk_text_redacted', columnType: 'text' })
  chunkTextRedacted!: string;

  @Property({ fieldName: 'token_count', columnType: 'int' })
  tokenCount!: number;

  @Property({ fieldName: 'chunk_hash', columnType: 'varchar' })
  chunkHash!: string;

  @Property({ fieldName: 'section_path', columnType: 'varchar' })
  sectionPath!: string;

  @Property({ type: 'json', columnType: 'jsonb' })
  metadata!: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
