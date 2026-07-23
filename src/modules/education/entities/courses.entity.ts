import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'courses' })
export class Courses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'course_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  courseTypeConceptId!: string;

  @Property({ fieldName: 'specialty_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  specialtyConceptId?: string;

  @Property({ fieldName: 'level_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  levelConceptId?: string;

  @Property({ fieldName: 'language_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  languageConceptId?: string;

  @Property({ fieldName: 'cover_file_id', type: 'uuid', nullable: true }) // FK → common.files
  coverFileId?: string;

  @Property({ fieldName: 'is_accredited', type: 'boolean', nullable: true })
  isAccredited?: boolean;

  @Property({
    fieldName: 'cme_credit_hours',
    columnType: 'numeric',
    nullable: true,
  })
  cmeCreditHours?: string;

  @Property({
    fieldName: 'accrediting_body_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  accreditingBodyConceptId?: string;

  @Property({ columnType: 'numeric', nullable: true })
  price?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  durationMinutes?: number;

  @Property({ fieldName: 'current_version', columnType: 'int' })
  currentVersion!: number;

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
