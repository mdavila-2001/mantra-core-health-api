import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `client_contexts`.
 */
@Entity({ schema: 'telemetry', tableName: 'client_contexts' })
export class ClientContexts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a session journey.
   */
  @Property({ fieldName: 'session_journey_id', type: 'uuid', nullable: true }) // FK → telemetry.session_journeys
  sessionJourneyId?: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @Property({ fieldName: 'analytics_subject_id', type: 'uuid', nullable: true }) // FK → telemetry.analytics_subjects
  analyticsSubjectId?: string;

  /**
   * Identificador asociado a session.
   */
  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true }) // FK → iam.sessions
  sessionId?: string;

  /**
   * Identificador asociado a portal type concept.
   */
  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  /**
   * Identificador asociado a device type concept.
   */
  @Property({
    fieldName: 'device_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  deviceTypeConceptId?: string;

  /**
   * Identificador asociado a os family concept.
   */
  @Property({ fieldName: 'os_family_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  osFamilyConceptId?: string;

  /**
   * Identificador asociado a browser family concept.
   */
  @Property({
    fieldName: 'browser_family_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  browserFamilyConceptId?: string;

  /**
   * Valor de app version mantenido por la instancia.
   */
  @Property({ fieldName: 'app_version', columnType: 'varchar', nullable: true })
  appVersion?: string;

  /**
   * Valor de screen class mantenido por la instancia.
   */
  @Property({
    fieldName: 'screen_class',
    columnType: 'varchar',
    nullable: true,
  })
  screenClass?: string;

  /**
   * Valor de viewport bucket mantenido por la instancia.
   */
  @Property({
    fieldName: 'viewport_bucket',
    columnType: 'varchar',
    nullable: true,
  })
  viewportBucket?: string;

  /**
   * Valor de locale mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  locale?: string;

  /**
   * Valor de timezone offset minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'timezone_offset_minutes',
    columnType: 'int',
    nullable: true,
  })
  timezoneOffsetMinutes?: number;

  /**
   * Identificador asociado a country concept.
   */
  @Property({ fieldName: 'country_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  countryConceptId?: string;

  /**
   * Valor de region coarse mantenido por la instancia.
   */
  @Property({
    fieldName: 'region_coarse',
    columnType: 'varchar',
    nullable: true,
  })
  regionCoarse?: string;

  /**
   * Valor de ip prefix hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'ip_prefix_hash',
    columnType: 'varchar',
    nullable: true,
  })
  ipPrefixHash?: string;

  /**
   * Valor de user agent hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'user_agent_hash',
    columnType: 'varchar',
    nullable: true,
  })
  userAgentHash?: string;

  /**
   * Valor de is bot mantenido por la instancia.
   */
  @Property({ fieldName: 'is_bot', type: 'boolean', nullable: true })
  isBot?: boolean;

  /**
   * Identificador asociado a data classification concept.
   */
  @Property({ fieldName: 'data_classification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dataClassificationConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
