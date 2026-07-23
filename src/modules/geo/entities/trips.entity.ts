import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'geo', tableName: 'trips' })
export class Trips {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tracking_session_id', type: 'uuid', nullable: true }) // FK → geo.tracking_sessions
  trackingSessionId?: string;

  @Property({ fieldName: 'origin_address_id', type: 'uuid', nullable: true }) // FK → common.addresses
  originAddressId?: string;

  @Property({
    fieldName: 'destination_address_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.addresses
  destinationAddressId?: string;

  @Property({ fieldName: 'distance_m', columnType: 'numeric', nullable: true })
  distanceM?: string;

  @Property({ fieldName: 'duration_s', columnType: 'int', nullable: true })
  durationS?: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

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
