import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'specimen_container_events' })
export class SpecimenContainerEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'specimen_container_id', type: 'uuid' }) // FK → diagnostics.specimen_containers
  specimenContainerId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  @Property({ fieldName: 'source_location_id', type: 'uuid', nullable: true }) // FK → diagnostics.dicom_object_locations
  sourceLocationId?: string;

  @Property({
    fieldName: 'destination_location_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.care_spaces
  destinationLocationId?: string;

  @Property({ fieldName: 'actor_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  actorProfileId?: string;

  @Property({
    fieldName: 'temperature_celsius',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  temperatureCelsius?: string;

  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
