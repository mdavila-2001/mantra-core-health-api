import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_social_posts`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_social_posts' })
export class InsightsSocialPosts {
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
   * Valor de platform code mantenido por la instancia.
   */
  @Property({ fieldName: 'platform_code', columnType: 'varchar' })
  platformCode!: string;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @Property({ fieldName: 'published_at', columnType: 'timestamptz' })
  publishedAt!: Date;

  /**
   * Valor de format code mantenido por la instancia.
   */
  @Property({ fieldName: 'format_code', columnType: 'varchar' })
  formatCode!: string;

  /**
   * Valor de topic code mantenido por la instancia.
   */
  @Property({ fieldName: 'topic_code', columnType: 'varchar' })
  topicCode!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de impressions mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  impressions?: string;

  /**
   * Valor de reach mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  reach?: string;

  /**
   * Valor de engagements mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  engagements?: string;

  /**
   * Valor de video views mantenido por la instancia.
   */
  @Property({ fieldName: 'video_views', type: 'bigint', nullable: true })
  videoViews?: string;

  /**
   * Valor de shares mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  shares?: string;

  /**
   * Valor de saves mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  saves?: string;

  /**
   * Valor de comments mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  comments?: string;

  /**
   * Valor de clicks mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  clicks?: string;

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
