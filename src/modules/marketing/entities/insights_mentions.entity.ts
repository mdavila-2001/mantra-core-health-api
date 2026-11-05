import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_mentions`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_mentions' })
export class InsightsMentions {
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
   * Valor de mentioned at mantenido por la instancia.
   */
  @Property({ fieldName: 'mentioned_at', columnType: 'timestamptz' })
  mentionedAt!: Date;

  /**
   * Valor de brand code mantenido por la instancia.
   */
  @Property({ fieldName: 'brand_code', columnType: 'varchar' })
  brandCode!: string;

  /**
   * Valor de source code mantenido por la instancia.
   */
  @Property({ fieldName: 'source_code', columnType: 'varchar' })
  sourceCode!: string;

  /**
   * Valor de topic code mantenido por la instancia.
   */
  @Property({ fieldName: 'topic_code', columnType: 'varchar' })
  topicCode!: string;

  /**
   * Valor de sentiment code mantenido por la instancia.
   */
  @Property({ fieldName: 'sentiment_code', columnType: 'varchar' })
  sentimentCode!: string;

  /**
   * Valor de kind code mantenido por la instancia.
   */
  @Property({ fieldName: 'kind_code', columnType: 'varchar' })
  kindCode!: string;

  /**
   * Valor de department code mantenido por la instancia.
   */
  @Property({
    fieldName: 'department_code',
    columnType: 'varchar',
    nullable: true,
  })
  departmentCode?: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  /**
   * Valor de reach mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  reach?: string;

  /**
   * Valor de confidence mantenido por la instancia.
   */
  @Property({ columnType: 'numeric(5,4)', nullable: true })
  confidence?: string;

  /**
   * Valor de needs response mantenido por la instancia.
   */
  @Property({ fieldName: 'needs_response', type: 'boolean', default: false })
  needsResponse!: boolean;

  /**
   * Valor de responded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

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
