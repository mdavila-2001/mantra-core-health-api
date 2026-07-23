import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'object_storage', tableName: 'dicom_series_manifests' })
export class DicomSeriesManifests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dicom_study_manifest_id', type: 'uuid' })
  dicomStudyManifestId!: string;

  @Property({ fieldName: 'series_instance_uid', columnType: 'varchar' })
  seriesInstanceUid!: string;

  @Property({ columnType: 'varchar' })
  modality!: string;

  @Property({ fieldName: 'series_number', columnType: 'int' })
  seriesNumber!: number;

  @Property({ fieldName: 'body_part_examined', columnType: 'varchar' })
  bodyPartExamined!: string;

  @Property({ fieldName: 'instance_count', columnType: 'int' })
  instanceCount!: number;

  @Property({ fieldName: 'thumbnail_object_manifest_id', type: 'uuid' })
  thumbnailObjectManifestId!: string;
}
