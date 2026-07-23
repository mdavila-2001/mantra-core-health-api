import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'media_annotations' })
export class MediaAnnotations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'clinical_media_id', type: 'uuid' }) // FK → diagnostics.clinical_media
  clinicalMediaId!: string;

  @Property({ fieldName: 'imaging_instance_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_instances
  imagingInstanceId?: string;

  @Property({ fieldName: 'annotation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  annotationTypeConceptId!: string;

  @Property({
    fieldName: 'geometry_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  geometryJson?: unknown;

  @Property({ fieldName: 'label_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  labelConceptId?: string;

  @Property({ fieldName: 'label_text', columnType: 'varchar', nullable: true })
  labelText?: string;

  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

  @Property({ fieldName: 'author_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  authorProfileId?: string;

  @Property({
    fieldName: 'algorithm_model_reference',
    columnType: 'varchar',
    nullable: true,
  })
  algorithmModelReference?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
