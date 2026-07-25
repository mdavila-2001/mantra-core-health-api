import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'anesthesia_events' })
export class AnesthesiaEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'anesthesia_plan_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.anesthesia_plans
  anesthesiaPlanId?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({
    fieldName: 'medication_administration_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.medication_records
  medicationAdministrationId?: string;

  @Property({ fieldName: 'observation_id', type: 'uuid', nullable: true }) // FK → clinical.observations
  observationId?: string;

  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  deviceId?: string;

  @Property({
    fieldName: 'performed_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  performedByProfileId?: string;

  @Property({
    fieldName: 'details_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  detailsJson?: unknown;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
