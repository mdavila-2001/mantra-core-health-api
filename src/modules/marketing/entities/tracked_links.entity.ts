import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `tracked_links`.
 */
@Entity({ schema: 'marketing', tableName: 'tracked_links' })
export class TrackedLinks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de target url mantenido por la instancia.
   */
  @Property({ fieldName: 'target_url', columnType: 'text' })
  targetUrl!: string;

  /**
   * Valor de utm source mantenido por la instancia.
   */
  @Property({ fieldName: 'utm_source', columnType: 'varchar', nullable: true })
  utmSource?: string;

  /**
   * Valor de utm medium mantenido por la instancia.
   */
  @Property({ fieldName: 'utm_medium', columnType: 'varchar', nullable: true })
  utmMedium?: string;

  /**
   * Valor de utm campaign mantenido por la instancia.
   */
  @Property({
    fieldName: 'utm_campaign',
    columnType: 'varchar',
    nullable: true,
  })
  utmCampaign?: string;

  /**
   * Valor de utm content mantenido por la instancia.
   */
  @Property({ fieldName: 'utm_content', columnType: 'varchar', nullable: true })
  utmContent?: string;

  /**
   * Valor de click count mantenido por la instancia.
   */
  @Property({ fieldName: 'click_count', type: 'bigint', nullable: true })
  clickCount?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
