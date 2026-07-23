import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'imaging_instances' })
export class ImagingInstances {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'imaging_series_id', type: 'uuid' }) // FK → diagnostics.imaging_series
  imagingSeriesId!: string;

  @Property({ fieldName: 'dicom_sop_instance_uid', columnType: 'varchar' })
  dicomSopInstanceUid!: string;

  @Property({ fieldName: 'sop_class_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sopClassConceptId!: string;

  @Property({ fieldName: 'instance_number', columnType: 'int', nullable: true })
  instanceNumber?: number;

  @Property({ fieldName: 'frames_count', columnType: 'int', nullable: true })
  framesCount?: number;

  @Property({ fieldName: 'retrieval_uri', columnType: 'text', nullable: true })
  retrievalUri?: string;

  @Property({
    fieldName: 'metadata_hash',
    columnType: 'varchar',
    nullable: true,
  })
  metadataHash?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
