import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `context_source_observations`.
 */
@Entity({ schema: 'health_context', tableName: 'context_source_observations' })
export class ContextSourceObservations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a collection run.
   */
  @Property({ fieldName: 'collection_run_id', type: 'uuid' }) // FK → health_context.context_collection_runs
  collectionRunId!: string;

  /**
   * Identificador asociado a source.
   */
  @Property({ fieldName: 'source_id', type: 'uuid' }) // FK → health_context.health_context_sources
  sourceId!: string;

  /**
   * Identificador asociado a country concept.
   */
  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  /**
   * Valor de source locator mantenido por la instancia.
   */
  @Property({ fieldName: 'source_locator', columnType: 'text' })
  sourceLocator!: string;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  /**
   * Valor de retrieved at mantenido por la instancia.
   */
  @Property({ fieldName: 'retrieved_at', columnType: 'timestamptz' })
  retrievedAt!: Date;

  /**
   * Valor de media type mantenido por la instancia.
   */
  @Property({ fieldName: 'media_type', columnType: 'varchar', nullable: true })
  mediaType?: string;

  /**
   * Identificador asociado a raw payload file.
   */
  @Property({ fieldName: 'raw_payload_file_id', type: 'uuid', nullable: true }) // FK → common.files
  rawPayloadFileId?: string;

  /**
   * Valor de extracted payload json mantenido por la instancia.
   */
  @Property({
    fieldName: 'extracted_payload_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  extractedPayloadJson?: unknown;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
