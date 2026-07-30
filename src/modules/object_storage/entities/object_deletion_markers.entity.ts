import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `object_deletion_markers`.
 */
@Entity({ schema: 'object_storage', tableName: 'object_deletion_markers' })
export class ObjectDeletionMarkers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a object manifest.
   */
  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  /**
   * Identificador asociado a requested by job.
   */
  @Property({ fieldName: 'requested_by_job_id', type: 'uuid' })
  requestedByJobId!: string;

  /**
   * Valor de provider delete marker mantenido por la instancia.
   */
  @Property({ fieldName: 'provider_delete_marker', columnType: 'varchar' })
  providerDeleteMarker!: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Valor de effective at mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_at', columnType: 'timestamptz' })
  effectiveAt!: Date;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @Property({ fieldName: 'verification_status', columnType: 'varchar' })
  verificationStatus!: string;
}
