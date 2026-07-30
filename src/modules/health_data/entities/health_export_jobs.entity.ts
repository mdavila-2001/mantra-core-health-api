import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_export_jobs`.
 */
@Entity({ schema: 'health_data', tableName: 'health_export_jobs' })
export class HealthExportJobs {
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
   * Identificador asociado a export type concept.
   */
  @Property({ fieldName: 'export_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  exportTypeConceptId!: string;

  /**
   * Identificador asociado a requested by user.
   */
  @Property({ fieldName: 'requested_by_user_id', type: 'uuid' }) // FK → iam.users
  requestedByUserId!: string;

  /**
   * Identificador asociado a purpose of use concept.
   */
  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid', nullable: true }) // FK → profiles.patient_profiles
  patientProfileId?: string;

  /**
   * Identificador asociado a cohort definition.
   */
  @Property({ fieldName: 'cohort_definition_id', type: 'uuid', nullable: true }) // FK → lakehouse.cohort_definitions
  cohortDefinitionId?: string;

  /**
   * Identificador asociado a consent directive.
   */
  @Property({ fieldName: 'consent_directive_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  consentDirectiveId?: string;

  /**
   * Identificador asociado a deidentification run.
   */
  @Property({
    fieldName: 'deidentification_run_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.health_deidentification_runs
  deidentificationRunId?: string;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Valor de delivery destination json mantenido por la instancia.
   */
  @Property({
    fieldName: 'delivery_destination_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  deliveryDestinationJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
