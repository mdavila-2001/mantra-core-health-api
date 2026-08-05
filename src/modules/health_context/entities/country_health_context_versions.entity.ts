import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `country_health_context_versions`.
 */
@Entity({
  schema: 'health_context',
  tableName: 'country_health_context_versions',
})
export class CountryHealthContextVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a country health context.
   */
  @Property({ fieldName: 'country_health_context_id', type: 'uuid' }) // FK → health_context.country_health_contexts
  countryHealthContextId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a collection run.
   */
  @Property({ fieldName: 'collection_run_id', type: 'uuid' }) // FK → health_context.context_collection_runs
  collectionRunId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @Property({ fieldName: 'schema_version', columnType: 'varchar' })
  schemaVersion!: string;

  /**
   * Valor de summary mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  summary?: string;

  /**
   * Valor de context payload json mantenido por la instancia.
   */
  @Property({
    fieldName: 'context_payload_json',
    type: 'json',
    columnType: 'jsonb',
  })
  contextPayloadJson!: unknown;

  /**
   * Valor de observed at mantenido por la instancia.
   */
  @Property({ fieldName: 'observed_at', columnType: 'timestamptz' })
  observedAt!: Date;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

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
