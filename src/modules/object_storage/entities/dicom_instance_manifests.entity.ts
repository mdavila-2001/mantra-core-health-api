import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'dicom_instance_manifests' })
export class DicomInstanceManifests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dicom_series_manifest_id', type: 'uuid' })
  dicomSeriesManifestId!: string;

  @Property({ fieldName: 'sop_instance_uid', columnType: 'varchar' })
  sopInstanceUid!: string;

  @Property({ fieldName: 'sop_class_uid', columnType: 'varchar' })
  sopClassUid!: string;

  @Property({ fieldName: 'instance_number', columnType: 'int' })
  instanceNumber!: number;

  @Property({ fieldName: 'transfer_syntax_uid', columnType: 'varchar' })
  transferSyntaxUid!: string;

  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  @Property({ fieldName: 'frame_count', columnType: 'int' })
  frameCount!: number;

  @Property({ fieldName: 'metadata_json', type: 'json', columnType: 'jsonb' })
  metadataJson!: unknown;
}
