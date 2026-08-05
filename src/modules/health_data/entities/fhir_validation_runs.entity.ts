import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `fhir_validation_runs`.
 */
@Entity({ schema: 'health_data', tableName: 'fhir_validation_runs' })
export class FhirValidationRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a canonical health resource version.
   */
  @Property({ fieldName: 'canonical_health_resource_version_id', type: 'uuid' }) // FK → health_data.canonical_health_resource_versions
  canonicalHealthResourceVersionId!: string;

  /**
   * Identificador asociado a fhir profile version.
   */
  @Property({ fieldName: 'fhir_profile_version_id', type: 'uuid' }) // FK → health_data.fhir_profile_versions
  fhirProfileVersionId!: string;

  /**
   * Valor de validator version mantenido por la instancia.
   */
  @Property({ fieldName: 'validator_version', columnType: 'varchar' })
  validatorVersion!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Valor de issue count mantenido por la instancia.
   */
  @Property({ fieldName: 'issue_count', columnType: 'int', nullable: true })
  issueCount?: number;

  /**
   * Valor de summary json mantenido por la instancia.
   */
  @Property({
    fieldName: 'summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  summaryJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
