import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `imaging_series`.
 */
@Entity({ schema: 'diagnostics', tableName: 'imaging_series' })
export class ImagingSeries {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a imaging study.
   */
  @Property({ fieldName: 'imaging_study_id', type: 'uuid' }) // FK → diagnostics.imaging_studies
  imagingStudyId!: string;

  /**
   * Valor de dicom series instance uid mantenido por la instancia.
   */
  @Property({ fieldName: 'dicom_series_instance_uid', columnType: 'varchar' })
  dicomSeriesInstanceUid!: string;

  /**
   * Identificador asociado a modality concept.
   */
  @Property({ fieldName: 'modality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  modalityConceptId!: string;

  /**
   * Identificador asociado a body site concept.
   */
  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a laterality concept.
   */
  @Property({
    fieldName: 'laterality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lateralityConceptId?: string;

  /**
   * Valor de series number mantenido por la instancia.
   */
  @Property({ fieldName: 'series_number', columnType: 'int', nullable: true })
  seriesNumber?: number;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  /**
   * Valor de number of instances mantenido por la instancia.
   */
  @Property({
    fieldName: 'number_of_instances',
    columnType: 'int',
    nullable: true,
  })
  numberOfInstances?: number;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
