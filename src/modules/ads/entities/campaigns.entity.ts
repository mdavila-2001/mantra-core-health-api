import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `campaigns`.
 */
@Entity({ schema: 'ads', tableName: 'campaigns' })
export class Campaigns {
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
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a objective concept.
   */
  @Property({ fieldName: 'objective_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectiveConceptId!: string;

  /**
   * Identificador asociado a buying type concept.
   */
  @Property({ fieldName: 'buying_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  buyingTypeConceptId!: string;

  /**
   * Valor de special ad categories json mantenido por la instancia.
   */
  @Property({
    fieldName: 'special_ad_categories_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  specialAdCategoriesJson?: unknown;

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
   * Valor de spend cap mantenido por la instancia.
   */
  @Property({ fieldName: 'spend_cap', columnType: 'numeric', nullable: true })
  spendCap?: string;

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
   * Valor de stop at mantenido por la instancia.
   */
  @Property({ fieldName: 'stop_at', columnType: 'timestamptz', nullable: true })
  stopAt?: Date;

  /**
   * Valor de external campaign ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_campaign_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalCampaignRef?: string;

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
