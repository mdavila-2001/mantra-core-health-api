import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'targeting_specs' })
export class TargetingSpecs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  name?: string;

  @Property({
    fieldName: 'geo_locations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  geoLocationsJson?: unknown;

  @Property({
    fieldName: 'excluded_geo_locations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  excludedGeoLocationsJson?: unknown;

  @Property({ fieldName: 'age_min', columnType: 'int', nullable: true })
  ageMin?: number;

  @Property({ fieldName: 'age_max', columnType: 'int', nullable: true })
  ageMax?: number;

  @Property({
    fieldName: 'genders_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  gendersJson?: unknown;

  @Property({
    fieldName: 'interests_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  interestsJson?: unknown;

  @Property({
    fieldName: 'behaviors_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  behaviorsJson?: unknown;

  @Property({
    fieldName: 'demographics_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  demographicsJson?: unknown;

  @Property({
    fieldName: 'custom_audience_ids_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  customAudienceIdsJson?: unknown;

  @Property({
    fieldName: 'excluded_custom_audience_ids_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  excludedCustomAudienceIdsJson?: unknown;

  @Property({
    fieldName: 'locales_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  localesJson?: unknown;

  @Property({
    fieldName: 'device_platforms_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  devicePlatformsJson?: unknown;

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
