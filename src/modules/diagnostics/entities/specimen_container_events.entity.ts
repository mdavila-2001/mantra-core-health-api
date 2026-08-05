import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `specimen_container_events`.
 */
@Entity({ schema: 'diagnostics', tableName: 'specimen_container_events' })
export class SpecimenContainerEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a specimen container.
   */
  @Property({ fieldName: 'specimen_container_id', type: 'uuid' }) // FK → diagnostics.specimen_containers
  specimenContainerId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Identificador asociado a event type concept.
   */
  @Property({ fieldName: 'event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a source location.
   */
  @Property({ fieldName: 'source_location_id', type: 'uuid', nullable: true }) // FK → diagnostics.dicom_object_locations
  sourceLocationId?: string;

  /**
   * Identificador asociado a destination location.
   */
  @Property({
    fieldName: 'destination_location_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.care_spaces
  destinationLocationId?: string;

  /**
   * Identificador asociado a actor profile.
   */
  @Property({ fieldName: 'actor_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  actorProfileId?: string;

  /**
   * Valor de temperature celsius mantenido por la instancia.
   */
  @Property({
    fieldName: 'temperature_celsius',
    columnType: 'numeric(8,3)',
    nullable: true,
  })
  temperatureCelsius?: string;

  /**
   * Valor de condition json mantenido por la instancia.
   */
  @Property({
    fieldName: 'condition_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  conditionJson?: unknown;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
