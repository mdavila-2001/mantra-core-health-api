import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_sets`.
 */
@Entity({ schema: 'ads', tableName: 'ad_sets' })
export class AdSets {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → ads.campaigns
  campaignId!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a optimization goal concept.
   */
  @Property({ fieldName: 'optimization_goal_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  optimizationGoalConceptId!: string;

  /**
   * Identificador asociado a billing event concept.
   */
  @Property({ fieldName: 'billing_event_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  billingEventConceptId!: string;

  /**
   * Valor de bid amount mantenido por la instancia.
   */
  @Property({ fieldName: 'bid_amount', columnType: 'numeric', nullable: true })
  bidAmount?: string;

  /**
   * Identificador asociado a bid strategy concept.
   */
  @Property({
    fieldName: 'bid_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  bidStrategyConceptId?: string;

  /**
   * Valor de daily budget mantenido por la instancia.
   */
  @Property({
    fieldName: 'daily_budget',
    columnType: 'numeric',
    nullable: true,
  })
  dailyBudget?: string;

  /**
   * Valor de lifetime budget mantenido por la instancia.
   */
  @Property({
    fieldName: 'lifetime_budget',
    columnType: 'numeric',
    nullable: true,
  })
  lifetimeBudget?: string;

  /**
   * Identificador asociado a targeting spec.
   */
  @Property({ fieldName: 'targeting_spec_id', type: 'uuid', nullable: true }) // FK → ads.targeting_specs
  targetingSpecId?: string;

  /**
   * Valor de promoted object json mantenido por la instancia.
   */
  @Property({
    fieldName: 'promoted_object_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  promotedObjectJson?: unknown;

  /**
   * Identificador asociado a pacing type concept.
   */
  @Property({
    fieldName: 'pacing_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  pacingTypeConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a effective status concept.
   */
  @Property({
    fieldName: 'effective_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  effectiveStatusConceptId?: string;

  /**
   * Valor de start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  /**
   * Valor de end at mantenido por la instancia.
   */
  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  /**
   * Valor de external adset ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_adset_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalAdsetRef?: string;

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
