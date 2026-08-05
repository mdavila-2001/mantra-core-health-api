import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_sync_runs`.
 */
@Entity({ schema: 'ads', tableName: 'ad_sync_runs' })
export class AdSyncRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a platform connection.
   */
  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK → ads.ad_platform_connections
  platformConnectionId!: string;

  /**
   * Identificador asociado a sync direction concept.
   */
  @Property({ fieldName: 'sync_direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  syncDirectionConceptId!: string;

  /**
   * Identificador asociado a object type concept.
   */
  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de ended at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de objects read mantenido por la instancia.
   */
  @Property({ fieldName: 'objects_read', type: 'bigint', nullable: true })
  objectsRead?: string;

  /**
   * Valor de objects written mantenido por la instancia.
   */
  @Property({ fieldName: 'objects_written', type: 'bigint', nullable: true })
  objectsWritten?: string;

  /**
   * Valor de objects failed mantenido por la instancia.
   */
  @Property({ fieldName: 'objects_failed', type: 'bigint', nullable: true })
  objectsFailed?: string;

  /**
   * Valor de error summary json mantenido por la instancia.
   */
  @Property({
    fieldName: 'error_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  errorSummaryJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
