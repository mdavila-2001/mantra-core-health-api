import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'fhir_validation_issues' })
export class FhirValidationIssues {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'fhir_validation_run_id', type: 'uuid' }) // FK → health_data.fhir_validation_runs
  fhirValidationRunId!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ fieldName: 'issue_code', columnType: 'varchar' })
  issueCode!: string;

  @Property({
    fieldName: 'expression_path',
    columnType: 'varchar',
    nullable: true,
  })
  expressionPath?: string;

  @Property({
    fieldName: 'diagnostics_text',
    columnType: 'text',
    nullable: true,
  })
  diagnosticsText?: string;

  @Property({
    fieldName: 'location_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  locationJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
