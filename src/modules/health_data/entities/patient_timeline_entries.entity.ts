import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'patient_timeline_entries' })
export class PatientTimelineEntries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'event_time', columnType: 'timestamptz' })
  eventTime!: Date;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ fieldName: 'source_entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceEntityTypeConceptId!: string;

  @Property({ fieldName: 'source_entity_id', type: 'uuid' })
  sourceEntityId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'organization_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  organizationId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  title?: string;

  @Property({
    fieldName: 'summary_redacted',
    columnType: 'text',
    nullable: true,
  })
  summaryRedacted?: string;

  @Property({
    fieldName: 'clinical_priority_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  clinicalPriorityConceptId?: string;

  @Property({
    fieldName: 'patient_visibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  patientVisibilityConceptId?: string;

  @Property({
    fieldName: 'security_labels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  securityLabelsJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
