import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `physical_exam_findings`.
 */
@Entity({ schema: 'chart', tableName: 'physical_exam_findings' })
export class PhysicalExamFindings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a clinical note version.
   */
  @Property({ fieldName: 'clinical_note_version_id', type: 'uuid' }) // FK → chart.clinical_note_versions
  clinicalNoteVersionId!: string;

  /**
   * Identificador asociado a body system concept.
   */
  @Property({ fieldName: 'body_system_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bodySystemConceptId!: string;

  /**
   * Identificador asociado a finding concept.
   */
  @Property({ fieldName: 'finding_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  findingConceptId?: string;

  /**
   * Valor de is normal mantenido por la instancia.
   */
  @Property({ fieldName: 'is_normal', type: 'boolean', nullable: true })
  isNormal?: boolean;

  /**
   * Valor de finding text mantenido por la instancia.
   */
  @Property({ fieldName: 'finding_text', columnType: 'text', nullable: true })
  findingText?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
