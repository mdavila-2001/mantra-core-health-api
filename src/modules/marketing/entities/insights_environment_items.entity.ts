import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_environment_items`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_environment_items' })
export class InsightsEnvironmentItems {
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
   * Valor de published on mantenido por la instancia.
   */
  @Property({ fieldName: 'published_on', columnType: 'date' })
  publishedOn!: Date;

  /**
   * Valor de domain code mantenido por la instancia.
   */
  @Property({ fieldName: 'domain_code', columnType: 'varchar' })
  domainCode!: string;

  /**
   * Valor de category code mantenido por la instancia.
   */
  @Property({ fieldName: 'category_code', columnType: 'varchar' })
  categoryCode!: string;

  /**
   * Valor de scope code mantenido por la instancia.
   */
  @Property({ fieldName: 'scope_code', columnType: 'varchar' })
  scopeCode!: string;

  /**
   * Valor de kind code mantenido por la instancia.
   */
  @Property({ fieldName: 'kind_code', columnType: 'varchar' })
  kindCode!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de source name mantenido por la instancia.
   */
  @Property({ fieldName: 'source_name', columnType: 'varchar', nullable: true })
  sourceName?: string;

  /**
   * Valor de affects text mantenido por la instancia.
   */
  @Property({ fieldName: 'affects_text', columnType: 'text', nullable: true })
  affectsText?: string;

  /**
   * Valor de relevance mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  relevance!: number;

  /**
   * Valor de impact text mantenido por la instancia.
   */
  @Property({ fieldName: 'impact_text', columnType: 'text', nullable: true })
  impactText?: string;

  /**
   * Valor de action text mantenido por la instancia.
   */
  @Property({ fieldName: 'action_text', columnType: 'text', nullable: true })
  actionText?: string;

  /**
   * Valor de monitor text mantenido por la instancia.
   */
  @Property({ fieldName: 'monitor_text', columnType: 'text', nullable: true })
  monitorText?: string;

  /**
   * Valor de campaign effects json mantenido por la instancia.
   */
  @Property({
    fieldName: 'campaign_effects_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  campaignEffectsJson?: unknown;

  /**
   * Valor de analysis json mantenido por la instancia.
   */
  @Property({
    fieldName: 'analysis_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  analysisJson?: unknown;

  /**
   * Valor de trend seed mantenido por la instancia.
   */
  @Property({ fieldName: 'trend_seed', columnType: 'int', nullable: true })
  trendSeed?: number;

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
