import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'lakehouse', tableName: 'dataset_release_manifests' })
export class DatasetReleaseManifests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dataset_release_request_id', type: 'uuid' })
  datasetReleaseRequestId!: string;

  @Property({ fieldName: 'deidentification_run_id', type: 'uuid' })
  deidentificationRunId!: string;

  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  @Property({ fieldName: 'schema_version', columnType: 'varchar' })
  schemaVersion!: string;

  @Property({ fieldName: 'record_count', type: 'bigint' })
  recordCount!: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'expires_at', columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
