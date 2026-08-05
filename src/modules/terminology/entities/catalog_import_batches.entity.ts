import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `catalog_import_batches`.
 */
@Entity({ schema: 'terminology', tableName: 'catalog_import_batches' })
export class CatalogImportBatches {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a source.
   */
  @Property({ fieldName: 'source_id', type: 'uuid' }) // FK → terminology.terminology_sources
  sourceId!: string;

  /**
   * Identificador asociado a code system version.
   */
  @Property({
    fieldName: 'code_system_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.code_system_versions
  codeSystemVersionId?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Valor de total read mantenido por la instancia.
   */
  @Property({ fieldName: 'total_read', type: 'bigint', nullable: true })
  totalRead?: string;

  /**
   * Valor de total inserted mantenido por la instancia.
   */
  @Property({ fieldName: 'total_inserted', type: 'bigint', nullable: true })
  totalInserted?: string;

  /**
   * Valor de total errors mantenido por la instancia.
   */
  @Property({ fieldName: 'total_errors', type: 'bigint', nullable: true })
  totalErrors?: string;

  /**
   * Valor de checksum mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  checksum?: string;

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
