import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_context', tableName: 'context_source_observations' })
export class ContextSourceObservations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'collection_run_id', type: 'uuid' }) // FK (destino no resuelto)
  collectionRunId!: string;

  @Property({ fieldName: 'source_id', type: 'uuid' }) // FK (destino no resuelto)
  sourceId!: string;

  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  @Property({ fieldName: 'source_locator', columnType: 'text' })
  sourceLocator!: string;

  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  @Property({ fieldName: 'retrieved_at', columnType: 'timestamptz' })
  retrievedAt!: Date;

  @Property({ fieldName: 'media_type', columnType: 'varchar', nullable: true })
  mediaType?: string;

  @Property({ fieldName: 'raw_payload_file_id', type: 'uuid', nullable: true }) // FK → common.files
  rawPayloadFileId?: string;

  @Property({
    fieldName: 'extracted_payload_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  extractedPayloadJson?: unknown;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
