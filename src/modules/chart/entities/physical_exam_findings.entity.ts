import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'chart', tableName: 'physical_exam_findings' })
export class PhysicalExamFindings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'clinical_note_version_id', type: 'uuid' }) // FK → chart.clinical_note_versions
  clinicalNoteVersionId!: string;

  @Property({ fieldName: 'body_system_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bodySystemConceptId!: string;

  @Property({ fieldName: 'finding_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  findingConceptId?: string;

  @Property({ fieldName: 'is_normal', type: 'boolean', nullable: true })
  isNormal?: boolean;

  @Property({ fieldName: 'finding_text', columnType: 'text', nullable: true })
  findingText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
