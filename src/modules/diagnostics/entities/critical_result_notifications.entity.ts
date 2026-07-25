import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'critical_result_notifications' })
export class CriticalResultNotifications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'observation_id', type: 'uuid' }) // FK → clinical.observations
  observationId!: string;

  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

  @Property({ fieldName: 'criticality_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  criticalityConceptId!: string;

  @Property({ fieldName: 'detected_at', columnType: 'timestamptz' })
  detectedAt!: Date;

  @Property({
    fieldName: 'detected_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  detectedByProfileId?: string;

  @Property({ fieldName: 'notification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  notificationStatusConceptId!: string;

  @Property({ fieldName: 'notified_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  notifiedProfileId?: string;

  @Property({
    fieldName: 'notified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  notifiedAt?: Date;

  @Property({
    fieldName: 'acknowledged_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  acknowledgedByProfileId?: string;

  @Property({
    fieldName: 'acknowledged_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acknowledgedAt?: Date;

  @Property({ fieldName: 'escalation_policy_id', type: 'uuid', nullable: true }) // FK → platform_ops.escalation_policies
  escalationPolicyId?: string;

  @Property({
    fieldName: 'escalation_due_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  escalationDueAt?: Date;

  @Property({
    fieldName: 'communication_evidence_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_deliveries
  communicationEvidenceId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
