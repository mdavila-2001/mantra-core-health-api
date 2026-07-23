import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'lessons' })
export class Lessons {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'course_module_id', type: 'uuid' }) // FK → education.course_modules
  courseModuleId!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'content_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentTypeConceptId!: string;

  @Property({
    fieldName: 'body_richtext_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  bodyRichtextJson?: unknown;

  @Property({ fieldName: 'media_file_id', type: 'uuid', nullable: true }) // FK → common.files
  mediaFileId?: string;

  @Property({ fieldName: 'external_url', columnType: 'text', nullable: true })
  externalUrl?: string;

  @Property({
    fieldName: 'duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  durationMinutes?: number;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'is_preview', type: 'boolean', nullable: true })
  isPreview?: boolean;

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
