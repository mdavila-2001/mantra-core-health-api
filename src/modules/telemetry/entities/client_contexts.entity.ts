import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'telemetry', tableName: 'client_contexts' })
export class ClientContexts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'session_journey_id', type: 'uuid', nullable: true }) // FK → telemetry.session_journeys
  sessionJourneyId?: string;

  @Property({ fieldName: 'analytics_subject_id', type: 'uuid', nullable: true }) // FK → telemetry.analytics_subjects
  analyticsSubjectId?: string;

  @Property({ fieldName: 'session_id', type: 'uuid', nullable: true }) // FK → iam.sessions
  sessionId?: string;

  @Property({ fieldName: 'portal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  portalTypeConceptId!: string;

  @Property({
    fieldName: 'device_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  deviceTypeConceptId?: string;

  @Property({ fieldName: 'os_family_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  osFamilyConceptId?: string;

  @Property({
    fieldName: 'browser_family_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  browserFamilyConceptId?: string;

  @Property({ fieldName: 'app_version', columnType: 'varchar', nullable: true })
  appVersion?: string;

  @Property({
    fieldName: 'screen_class',
    columnType: 'varchar',
    nullable: true,
  })
  screenClass?: string;

  @Property({
    fieldName: 'viewport_bucket',
    columnType: 'varchar',
    nullable: true,
  })
  viewportBucket?: string;

  @Property({ columnType: 'varchar', nullable: true })
  locale?: string;

  @Property({
    fieldName: 'timezone_offset_minutes',
    columnType: 'int',
    nullable: true,
  })
  timezoneOffsetMinutes?: number;

  @Property({ fieldName: 'country_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  countryConceptId?: string;

  @Property({
    fieldName: 'region_coarse',
    columnType: 'varchar',
    nullable: true,
  })
  regionCoarse?: string;

  @Property({
    fieldName: 'ip_prefix_hash',
    columnType: 'varchar',
    nullable: true,
  })
  ipPrefixHash?: string;

  @Property({
    fieldName: 'user_agent_hash',
    columnType: 'varchar',
    nullable: true,
  })
  userAgentHash?: string;

  @Property({ fieldName: 'is_bot', type: 'boolean', nullable: true })
  isBot?: boolean;

  @Property({ fieldName: 'data_classification_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dataClassificationConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
