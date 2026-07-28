import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `location_pings`.
 */
@Entity({ schema: 'geo', tableName: 'location_pings' })
export class LocationPings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tracked subject.
   */
  @Property({ fieldName: 'tracked_subject_id', type: 'uuid' }) // FK → geo.tracked_subjects
  trackedSubjectId!: string;

  /**
   * Identificador asociado a device.
   */
  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  deviceId?: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  latitude!: string;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  longitude!: string;

  /**
   * Valor de accuracy m mantenido por la instancia.
   */
  @Property({ fieldName: 'accuracy_m', columnType: 'numeric', nullable: true })
  accuracyM?: string;

  /**
   * Valor de altitude m mantenido por la instancia.
   */
  @Property({ fieldName: 'altitude_m', columnType: 'numeric', nullable: true })
  altitudeM?: string;

  /**
   * Valor de speed mps mantenido por la instancia.
   */
  @Property({ fieldName: 'speed_mps', columnType: 'numeric', nullable: true })
  speedMps?: string;

  /**
   * Valor de heading deg mantenido por la instancia.
   */
  @Property({ fieldName: 'heading_deg', columnType: 'numeric', nullable: true })
  headingDeg?: string;

  /**
   * Valor de battery pct mantenido por la instancia.
   */
  @Property({ fieldName: 'battery_pct', columnType: 'int', nullable: true })
  batteryPct?: number;

  /**
   * Identificador asociado a network concept.
   */
  @Property({ fieldName: 'network_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  networkConceptId?: string;

  /**
   * Valor de captured at mantenido por la instancia.
   */
  @Property({
    fieldName: 'captured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  capturedAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
