import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'health_context',
  tableName: 'country_health_context_versions',
})
export class CountryHealthContextVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'country_health_context_id', type: 'uuid' }) // FK → health_context.country_health_contexts
  countryHealthContextId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'collection_run_id', type: 'uuid' }) // FK → health_context.context_collection_runs
  collectionRunId!: string;

  @Property({ fieldName: 'schema_version', columnType: 'varchar' })
  schemaVersion!: string;

  @Property({ columnType: 'text', nullable: true })
  summary?: string;

  @Property({
    fieldName: 'context_payload_json',
    type: 'json',
    columnType: 'jsonb',
  })
  contextPayloadJson!: unknown;

  @Property({ fieldName: 'observed_at', columnType: 'timestamptz' })
  observedAt!: Date;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
