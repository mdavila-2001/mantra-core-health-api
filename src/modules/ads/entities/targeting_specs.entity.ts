import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `targeting_specs`.
 */
@Entity({ schema: 'ads', tableName: 'targeting_specs' })
export class TargetingSpecs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  name?: string;

  /**
   * Valor de geo locations json mantenido por la instancia.
   */
  @Property({
    fieldName: 'geo_locations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  geoLocationsJson?: unknown;

  /**
   * Valor de excluded geo locations json mantenido por la instancia.
   */
  @Property({
    fieldName: 'excluded_geo_locations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  excludedGeoLocationsJson?: unknown;

  /**
   * Valor de age min mantenido por la instancia.
   */
  @Property({ fieldName: 'age_min', columnType: 'int', nullable: true })
  ageMin?: number;

  /**
   * Valor de age max mantenido por la instancia.
   */
  @Property({ fieldName: 'age_max', columnType: 'int', nullable: true })
  ageMax?: number;

  /**
   * Valor de genders json mantenido por la instancia.
   */
  @Property({
    fieldName: 'genders_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  gendersJson?: unknown;

  /**
   * Valor de interests json mantenido por la instancia.
   */
  @Property({
    fieldName: 'interests_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  interestsJson?: unknown;

  /**
   * Valor de behaviors json mantenido por la instancia.
   */
  @Property({
    fieldName: 'behaviors_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  behaviorsJson?: unknown;

  /**
   * Valor de demographics json mantenido por la instancia.
   */
  @Property({
    fieldName: 'demographics_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  demographicsJson?: unknown;

  /**
   * Valor de custom audience ids json mantenido por la instancia.
   */
  @Property({
    fieldName: 'custom_audience_ids_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  customAudienceIdsJson?: unknown;

  /**
   * Valor de excluded custom audience ids json mantenido por la instancia.
   */
  @Property({
    fieldName: 'excluded_custom_audience_ids_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  excludedCustomAudienceIdsJson?: unknown;

  /**
   * Valor de locales json mantenido por la instancia.
   */
  @Property({
    fieldName: 'locales_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  localesJson?: unknown;

  /**
   * Valor de device platforms json mantenido por la instancia.
   */
  @Property({
    fieldName: 'device_platforms_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  devicePlatformsJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
