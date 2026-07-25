import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'location_ping_series' })
export class LocationPingSeries {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  @Property({ fieldName: 'subject_type', columnType: 'varchar' })
  subjectType!: string;

  @Property({ fieldName: 'subject_id', type: 'uuid' })
  subjectId!: string;

  @Property({ columnType: 'double precision' })
  latitude!: number;

  @Property({ columnType: 'double precision' })
  longitude!: number;

  @Property({
    fieldName: 'altitude_m',
    columnType: 'double precision',
    nullable: true,
  })
  altitudeM?: number;

  @Property({
    fieldName: 'accuracy_m',
    columnType: 'double precision',
    nullable: true,
  })
  accuracyM?: number;

  @Property({
    fieldName: 'speed_mps',
    columnType: 'double precision',
    nullable: true,
  })
  speedMps?: number;

  @Property({ columnType: 'varchar', nullable: true })
  geohash?: string;
}
