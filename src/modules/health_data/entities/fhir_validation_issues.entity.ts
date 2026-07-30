import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `fhir_validation_issues`.
 */
@Entity({ schema: 'health_data', tableName: 'fhir_validation_issues' })
export class FhirValidationIssues {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a fhir validation run.
   */
  @Property({ fieldName: 'fhir_validation_run_id', type: 'uuid' }) // FK → health_data.fhir_validation_runs
  fhirValidationRunId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Valor de issue code mantenido por la instancia.
   */
  @Property({ fieldName: 'issue_code', columnType: 'varchar' })
  issueCode!: string;

  /**
   * Valor de expression path mantenido por la instancia.
   */
  @Property({
    fieldName: 'expression_path',
    columnType: 'varchar',
    nullable: true,
  })
  expressionPath?: string;

  /**
   * Valor de diagnostics text mantenido por la instancia.
   */
  @Property({
    fieldName: 'diagnostics_text',
    columnType: 'text',
    nullable: true,
  })
  diagnosticsText?: string;

  /**
   * Valor de location json mantenido por la instancia.
   */
  @Property({
    fieldName: 'location_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  locationJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
