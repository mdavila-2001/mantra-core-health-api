import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'procedure_cases' })
export class ProcedureCases {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  @Property({ fieldName: 'primary_procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  primaryProcedureId?: string;

  @Property({ fieldName: 'case_number', columnType: 'varchar' })
  caseNumber!: string;

  @Property({ fieldName: 'case_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  caseTypeConceptId!: string;

  @Property({ fieldName: 'priority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  priorityConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'surgical_specialty_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  surgicalSpecialtyConceptId?: string;

  @Property({
    fieldName: 'requested_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  requestedByProfileId?: string;

  @Property({
    fieldName: 'primary_surgeon_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  primarySurgeonProfileId?: string;

  @Property({
    fieldName: 'anesthesiologist_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  anesthesiologistProfileId?: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  @Property({ fieldName: 'operating_room_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  operatingRoomId?: string;

  @Property({
    fieldName: 'scheduled_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledStartAt?: Date;

  @Property({
    fieldName: 'scheduled_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledEndAt?: Date;

  @Property({
    fieldName: 'actual_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  actualStartAt?: Date;

  @Property({
    fieldName: 'actual_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  actualEndAt?: Date;

  @Property({
    fieldName: 'cancellation_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  cancellationReasonConceptId?: string;

  @Property({
    fieldName: 'urgency_reason_text',
    columnType: 'text',
    nullable: true,
  })
  urgencyReasonText?: string;

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
