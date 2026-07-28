import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_report_results`.
 */
@Entity({ schema: 'diagnostics', tableName: 'diagnostic_report_results' })
export class DiagnosticReportResults {
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
   * Identificador asociado a observation.
   */
  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  /**
   * Identificador asociado a result role concept.
   */
  @Property({
    fieldName: 'result_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  resultRoleConceptId?: string;

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
}
