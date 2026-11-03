import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_creatives`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_creatives' })
export class InsightsCreatives {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → ads.campaigns (inferida)
  campaignId!: string;

  /**
   * Valor de channel code mantenido por la instancia.
   */
  @Property({ fieldName: 'channel_code', columnType: 'varchar' })
  channelCode!: string;

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
   * Valor de format code mantenido por la instancia.
   */
  @Property({ fieldName: 'format_code', columnType: 'varchar', nullable: true })
  formatCode?: string;

  /**
   * Valor de audience code mantenido por la instancia.
   */
  @Property({
    fieldName: 'audience_code',
    columnType: 'varchar',
    nullable: true,
  })
  audienceCode?: string;

  /**
   * Valor de cta code mantenido por la instancia.
   */
  @Property({ fieldName: 'cta_code', columnType: 'varchar', nullable: true })
  ctaCode?: string;

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
