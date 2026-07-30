import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dicom_series_manifests`.
 */
@Entity({ schema: 'object_storage', tableName: 'dicom_series_manifests' })
export class DicomSeriesManifests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dicom study manifest.
   */
  @Property({ fieldName: 'dicom_study_manifest_id', type: 'uuid' })
  dicomStudyManifestId!: string;

  /**
   * Valor de series instance uid mantenido por la instancia.
   */
  @Property({ fieldName: 'series_instance_uid', columnType: 'varchar' })
  seriesInstanceUid!: string;

  /**
   * Valor de modality mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  modality!: string;

  /**
   * Valor de series number mantenido por la instancia.
   */
  @Property({ fieldName: 'series_number', columnType: 'int' })
  seriesNumber!: number;

  /**
   * Valor de body part examined mantenido por la instancia.
   */
  @Property({ fieldName: 'body_part_examined', columnType: 'varchar' })
  bodyPartExamined!: string;

  /**
   * Valor de instance count mantenido por la instancia.
   */
  @Property({ fieldName: 'instance_count', columnType: 'int' })
  instanceCount!: number;

  /**
   * Identificador asociado a thumbnail object manifest.
   */
  @Property({ fieldName: 'thumbnail_object_manifest_id', type: 'uuid' })
  thumbnailObjectManifestId!: string;
}
