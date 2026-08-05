import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dicom_instance_manifests`.
 */
@Entity({ schema: 'object_storage', tableName: 'dicom_instance_manifests' })
export class DicomInstanceManifests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dicom series manifest.
   */
  @Property({ fieldName: 'dicom_series_manifest_id', type: 'uuid' })
  dicomSeriesManifestId!: string;

  /**
   * Valor de sop instance uid mantenido por la instancia.
   */
  @Property({ fieldName: 'sop_instance_uid', columnType: 'varchar' })
  sopInstanceUid!: string;

  /**
   * Valor de sop class uid mantenido por la instancia.
   */
  @Property({ fieldName: 'sop_class_uid', columnType: 'varchar' })
  sopClassUid!: string;

  /**
   * Valor de instance number mantenido por la instancia.
   */
  @Property({ fieldName: 'instance_number', columnType: 'int' })
  instanceNumber!: number;

  /**
   * Valor de transfer syntax uid mantenido por la instancia.
   */
  @Property({ fieldName: 'transfer_syntax_uid', columnType: 'varchar' })
  transferSyntaxUid!: string;

  /**
   * Identificador asociado a object manifest.
   */
  @Property({ fieldName: 'object_manifest_id', type: 'uuid' })
  objectManifestId!: string;

  /**
   * Valor de frame count mantenido por la instancia.
   */
  @Property({ fieldName: 'frame_count', columnType: 'int' })
  frameCount!: number;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @Property({ fieldName: 'metadata_json', type: 'json', columnType: 'jsonb' })
  metadataJson!: unknown;
}
