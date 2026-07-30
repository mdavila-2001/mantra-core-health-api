import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `archive_jobs`.
 */
@Entity({ schema: 'cross_store_consistency', tableName: 'archive_jobs' })
export class ArchiveJobs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a dataset.
   */
  @Property({ fieldName: 'dataset_id', type: 'uuid' })
  datasetId!: string;

  /**
   * Valor de retention cutoff mantenido por la instancia.
   */
  @Property({ fieldName: 'retention_cutoff', columnType: 'timestamptz' })
  retentionCutoff!: Date;

  /**
   * Identificador asociado a archive manifest object.
   */
  @Property({ fieldName: 'archive_manifest_object_id', type: 'uuid' })
  archiveManifestObjectId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  status!: string;

  /**
   * Valor de archived count mantenido por la instancia.
   */
  @Property({ fieldName: 'archived_count', type: 'bigint' })
  archivedCount!: string;

  /**
   * Valor de deleted hot count mantenido por la instancia.
   */
  @Property({ fieldName: 'deleted_hot_count', type: 'bigint' })
  deletedHotCount!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
