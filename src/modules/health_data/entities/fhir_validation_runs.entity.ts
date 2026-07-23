import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'fhir_validation_runs' })
export class FhirValidationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'canonical_health_resource_version_id', type: 'uuid' }) // FK → health_data.canonical_health_resource_versions
  canonicalHealthResourceVersionId!: string;

  @Property({ fieldName: 'fhir_profile_version_id', type: 'uuid' }) // FK → health_data.fhir_profile_versions
  fhirProfileVersionId!: string;

  @Property({ fieldName: 'validator_version', columnType: 'varchar' })
  validatorVersion!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({ fieldName: 'issue_count', columnType: 'int', nullable: true })
  issueCount?: number;

  @Property({
    fieldName: 'summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  summaryJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
