import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'imaging_series' })
export class ImagingSeries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'imaging_study_id', type: 'uuid' }) // FK → diagnostics.imaging_studies
  imagingStudyId!: string;

  @Property({ fieldName: 'dicom_series_instance_uid', columnType: 'varchar' })
  dicomSeriesInstanceUid!: string;

  @Property({ fieldName: 'modality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  modalityConceptId!: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({
    fieldName: 'laterality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  lateralityConceptId?: string;

  @Property({ fieldName: 'series_number', columnType: 'int', nullable: true })
  seriesNumber?: number;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({
    fieldName: 'number_of_instances',
    columnType: 'int',
    nullable: true,
  })
  numberOfInstances?: number;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
