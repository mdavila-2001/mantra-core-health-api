import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_deidentification_runs`.
 */
@Entity({ schema: 'health_data', tableName: 'health_deidentification_runs' })
export class HealthDeidentificationRuns {
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
   * Identificador asociado a health deidentification profile.
   */
  @Property({ fieldName: 'health_deidentification_profile_id', type: 'uuid' }) // FK → health_data.health_deidentification_profiles
  healthDeidentificationProfileId!: string;

  /**
   * Identificador asociado a purpose concept.
   */
  @Property({ fieldName: 'purpose_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeConceptId!: string;

  /**
   * Identificador asociado a consent directive.
   */
  @Property({ fieldName: 'consent_directive_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentDirectiveId?: string;

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
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a input manifest file.
   */
  @Property({
    fieldName: 'input_manifest_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  inputManifestFileId?: string;

  /**
   * Identificador asociado a output manifest file.
   */
  @Property({
    fieldName: 'output_manifest_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  outputManifestFileId?: string;

  /**
   * Valor de records processed mantenido por la instancia.
   */
  @Property({ fieldName: 'records_processed', type: 'bigint', nullable: true })
  recordsProcessed?: string;

  /**
   * Valor de records rejected mantenido por la instancia.
   */
  @Property({ fieldName: 'records_rejected', type: 'bigint', nullable: true })
  recordsRejected?: string;

  /**
   * Valor de verification summary json mantenido por la instancia.
   */
  @Property({
    fieldName: 'verification_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  verificationSummaryJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
