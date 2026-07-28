import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_report_files`.
 */
@Entity({ schema: 'diagnostics', tableName: 'diagnostic_report_files' })
export class DiagnosticReportFiles {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a diagnostic report version.
   */
  @Property({ fieldName: 'diagnostic_report_version_id', type: 'uuid' }) // FK → diagnostics.diagnostic_report_versions
  diagnosticReportVersionId!: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  /**
   * Identificador asociado a content role concept.
   */
  @Property({ fieldName: 'content_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentRoleConceptId!: string;

  /**
   * Identificador asociado a presentation format concept.
   */
  @Property({
    fieldName: 'presentation_format_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  presentationFormatConceptId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
