import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `vector_chunks`.
 */
@Entity({ schema: 'vector_rag', tableName: 'vector_chunks' })
export class VectorChunks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a vector document.
   */
  @Property({ fieldName: 'vector_document_id', type: 'uuid' })
  vectorDocumentId!: string;

  /**
   * Valor de chunk number mantenido por la instancia.
   */
  @Property({ fieldName: 'chunk_number', columnType: 'int' })
  chunkNumber!: number;

  /**
   * Valor de chunk text redacted mantenido por la instancia.
   */
  @Property({ fieldName: 'chunk_text_redacted', columnType: 'text' })
  chunkTextRedacted!: string;

  /**
   * Valor de token count mantenido por la instancia.
   */
  @Property({ fieldName: 'token_count', columnType: 'int' })
  tokenCount!: number;

  /**
   * Valor de chunk hash mantenido por la instancia.
   */
  @Property({ fieldName: 'chunk_hash', columnType: 'varchar' })
  chunkHash!: string;

  /**
   * Valor de section path mantenido por la instancia.
   */
  @Property({ fieldName: 'section_path', columnType: 'varchar' })
  sectionPath!: string;

  /**
   * Valor de metadata mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb' })
  metadata!: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
