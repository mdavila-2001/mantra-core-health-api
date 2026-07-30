import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `critical_result_notifications`.
 */
@Entity({ schema: 'diagnostics', tableName: 'critical_result_notifications' })
export class CriticalResultNotifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a observation.
   */
  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  /**
   * Identificador asociado a diagnostic report.
   */
  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

  /**
   * Identificador asociado a criticality concept.
   */
  @Property({ fieldName: 'criticality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  criticalityConceptId!: string;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;

  /**
   * Identificador asociado a detected by profile.
   */
  @Property({
    fieldName: 'detected_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  detectedByProfileId?: string;

  /**
   * Identificador asociado a notification status concept.
   */
  @Property({ fieldName: 'notification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  notificationStatusConceptId!: string;

  /**
   * Identificador asociado a notified profile.
   */
  @Property({ fieldName: 'notified_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  notifiedProfileId?: string;

  /**
   * Valor de notified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'notified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  notifiedAt?: Date;

  /**
   * Identificador asociado a acknowledged by profile.
   */
  @Property({
    fieldName: 'acknowledged_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  acknowledgedByProfileId?: string;

  /**
   * Valor de acknowledged at mantenido por la instancia.
   */
  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  /**
   * Identificador asociado a escalation policy.
   */
  @Property({ fieldName: 'escalation_policy_id', type: 'uuid', nullable: true }) // FK → platform_ops.escalation_policies
  escalationPolicyId?: string;

  /**
   * Valor de escalation due at mantenido por la instancia.
   */
  @Property({
    fieldName: 'escalation_due_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  escalationDueAt?: Date;

  /**
   * Identificador asociado a communication evidence.
   */
  @Property({
    fieldName: 'communication_evidence_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_deliveries
  communicationEvidenceId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
