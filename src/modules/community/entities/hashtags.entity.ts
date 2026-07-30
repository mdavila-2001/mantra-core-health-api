import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `hashtags`.
 */
@Entity({ schema: 'community', tableName: 'hashtags' })
export class Hashtags {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de tag mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  tag!: string;

  /**
   * Valor de normalized tag mantenido por la instancia.
   */
  @Property({
    fieldName: 'normalized_tag',
    columnType: 'varchar',
    nullable: true,
  })
  normalizedTag?: string;

  /**
   * Valor de usage count mantenido por la instancia.
   */
  @Property({ fieldName: 'usage_count', type: 'bigint', nullable: true })
  usageCount?: string;

  /**
   * Identificador asociado a topic.
   */
  @Property({ fieldName: 'topic_id', type: 'uuid', nullable: true }) // FK → community.topics
  topicId?: string;

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
