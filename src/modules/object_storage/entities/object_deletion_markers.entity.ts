import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'object_deletion_markers' })
export class ObjectDeletionMarkers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  @Property({ fieldName: 'requested_by_job_id', type: 'uuid' })
  requestedByJobId!: string;

  @Property({ fieldName: 'provider_delete_marker', columnType: 'varchar' })
  providerDeleteMarker!: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ fieldName: 'effective_at', columnType: 'timestamptz' })
  effectiveAt!: Date;

  @Property({ fieldName: 'verification_status', columnType: 'varchar' })
  verificationStatus!: string;
}
