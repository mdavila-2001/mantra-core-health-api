import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `brand_lift_studies`.
 */
@Entity({ schema: 'ads', tableName: 'brand_lift_studies' })
export class BrandLiftStudies {
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
   * Identificador asociado a metric concept.
   */
  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  /**
   * Valor de poll question mantenido por la instancia.
   */
  @Property({ fieldName: 'poll_question', columnType: 'text', nullable: true })
  pollQuestion?: string;

  /**
   * Valor de lift percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'lift_percent',
    columnType: 'numeric',
    nullable: true,
  })
  liftPercent?: string;

  /**
   * Valor de confidence mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  confidence?: string;

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
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
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
