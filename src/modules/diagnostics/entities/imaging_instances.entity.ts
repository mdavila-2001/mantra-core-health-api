import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `imaging_instances`.
 */
@Entity({ schema: 'diagnostics', tableName: 'imaging_instances' })
export class ImagingInstances {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a imaging series.
   */
  @Property({ fieldName: 'imaging_series_id', type: 'uuid' }) // FK → diagnostics.imaging_series
  imagingSeriesId!: string;

  /**
   * Valor de dicom sop instance uid mantenido por la instancia.
   */
  @Property({ fieldName: 'dicom_sop_instance_uid', columnType: 'varchar' })
  dicomSopInstanceUid!: string;

  /**
   * Identificador asociado a sop class concept.
   */
  @Property({ fieldName: 'sop_class_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sopClassConceptId!: string;

  /**
   * Valor de instance number mantenido por la instancia.
   */
  @Property({ fieldName: 'instance_number', columnType: 'int', nullable: true })
  instanceNumber?: number;

  /**
   * Valor de frames count mantenido por la instancia.
   */
  @Property({ fieldName: 'frames_count', columnType: 'int', nullable: true })
  framesCount?: number;

  /**
   * Valor de retrieval uri mantenido por la instancia.
   */
  @Property({ fieldName: 'retrieval_uri', columnType: 'text', nullable: true })
  retrievalUri?: string;

  /**
   * Valor de metadata hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'metadata_hash',
    columnType: 'varchar',
    nullable: true,
  })
  metadataHash?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
