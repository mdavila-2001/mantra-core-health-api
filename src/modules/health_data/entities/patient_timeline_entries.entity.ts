import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_timeline_entries`.
 */
@Entity({ schema: 'health_data', tableName: 'patient_timeline_entries' })
export class PatientTimelineEntries {
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
   * Valor de event time mantenido por la instancia.
   */
  @Property({ fieldName: 'event_time', columnType: 'timestamptz' })
  eventTime!: Date;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a source entity type concept.
   */
  @Property({ fieldName: 'source_entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceEntityTypeConceptId!: string;

  /**
   * Identificador asociado a source entity.
   */
  @Property({ fieldName: 'source_entity_id', type: 'uuid' })
  sourceEntityId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a organization.
   */
  @Property({ fieldName: 'organization_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  organizationId?: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  title?: string;

  /**
   * Valor de summary redacted mantenido por la instancia.
   */
  @Property({
    fieldName: 'summary_redacted',
    columnType: 'text',
    nullable: true,
  })
  summaryRedacted?: string;

  /**
   * Identificador asociado a clinical priority concept.
   */
  @Property({
    fieldName: 'clinical_priority_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  clinicalPriorityConceptId?: string;

  /**
   * Identificador asociado a patient visibility concept.
   */
  @Property({
    fieldName: 'patient_visibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  patientVisibilityConceptId?: string;

  /**
   * Valor de security labels json mantenido por la instancia.
   */
  @Property({
    fieldName: 'security_labels_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  securityLabelsJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
