import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'geo', tableName: 'location_pings' })
export class LocationPings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tracked_subject_id', type: 'uuid' }) // FK → geo.tracked_subjects
  trackedSubjectId!: string;

  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  deviceId?: string;

  @Property({ columnType: 'numeric' })
  latitude!: string;

  @Property({ columnType: 'numeric' })
  longitude!: string;

  @Property({ fieldName: 'accuracy_m', columnType: 'numeric', nullable: true })
  accuracyM?: string;

  @Property({ fieldName: 'altitude_m', columnType: 'numeric', nullable: true })
  altitudeM?: string;

  @Property({ fieldName: 'speed_mps', columnType: 'numeric', nullable: true })
  speedMps?: string;

  @Property({ fieldName: 'heading_deg', columnType: 'numeric', nullable: true })
  headingDeg?: string;

  @Property({ fieldName: 'battery_pct', columnType: 'int', nullable: true })
  batteryPct?: number;

  @Property({ fieldName: 'network_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  networkConceptId?: string;

  @Property({
    fieldName: 'captured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  capturedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
