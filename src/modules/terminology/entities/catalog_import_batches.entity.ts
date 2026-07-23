import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'terminology', tableName: 'catalog_import_batches' })
export class CatalogImportBatches {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'source_id', type: 'uuid' }) // FK (destino no resuelto)
  sourceId!: string;

  @Property({
    fieldName: 'code_system_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.code_system_versions
  codeSystemVersionId?: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'total_read', type: 'bigint', nullable: true })
  totalRead?: string;

  @Property({ fieldName: 'total_inserted', type: 'bigint', nullable: true })
  totalInserted?: string;

  @Property({ fieldName: 'total_errors', type: 'bigint', nullable: true })
  totalErrors?: string;

  @Property({ columnType: 'varchar', nullable: true })
  checksum?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
