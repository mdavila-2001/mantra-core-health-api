import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_campaigns`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_campaigns' })
export class InsightsCampaigns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de short name mantenido por la instancia.
   */
  @Property({ fieldName: 'short_name', columnType: 'varchar' })
  shortName!: string;

  /**
   * Valor de kind code mantenido por la instancia.
   */
  @Property({ fieldName: 'kind_code', columnType: 'varchar' })
  kindCode!: string;

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @Property({ fieldName: 'objective_text', columnType: 'text', nullable: true })
  objectiveText?: string;

  /**
   * Valor de audience text mantenido por la instancia.
   */
  @Property({
    fieldName: 'audience_text',
    columnType: 'varchar',
    nullable: true,
  })
  audienceText?: string;

  /**
   * Valor de start on mantenido por la instancia.
   */
  @Property({ fieldName: 'start_on', columnType: 'date' })
  startOn!: Date;

  /**
   * Valor de end on mantenido por la instancia.
   */
  @Property({ fieldName: 'end_on', columnType: 'date', nullable: true })
  endOn?: Date;

  /**
   * Valor de budget cents mantenido por la instancia.
   */
  @Property({ fieldName: 'budget_cents', type: 'bigint', nullable: true })
  budgetCents?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts (inferida)
  currencyConceptId?: string;

  /**
   * Valor de ltv cents mantenido por la instancia.
   */
  @Property({ fieldName: 'ltv_cents', type: 'bigint', nullable: true })
  ltvCents?: string;

  /**
   * Valor de revenue per conversion cents mantenido por la instancia.
   */
  @Property({
    fieldName: 'revenue_per_conversion_cents',
    type: 'bigint',
    nullable: true,
  })
  revenuePerConversionCents?: string;

  /**
   * Valor de owner team code mantenido por la instancia.
   */
  @Property({
    fieldName: 'owner_team_code',
    columnType: 'varchar',
    nullable: true,
  })
  ownerTeamCode?: string;

  /**
   * Valor de targets json mantenido por la instancia.
   */
  @Property({
    fieldName: 'targets_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  targetsJson?: unknown;

  /**
   * Identificador asociado a marketing campaign.
   */
  @Property({
    fieldName: 'marketing_campaign_id',
    type: 'uuid',
    nullable: true,
  }) // FK → marketing.marketing_campaigns
  marketingCampaignId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
