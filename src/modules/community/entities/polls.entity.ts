import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `polls`.
 */
@Entity({ schema: 'community', tableName: 'polls' })
export class Polls {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a post.
   */
  @Property({ fieldName: 'post_id', type: 'uuid' }) // FK → community.social_posts
  postId!: string;

  /**
   * Valor de question mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  question!: string;

  /**
   * Valor de allows multiple mantenido por la instancia.
   */
  @Property({ fieldName: 'allows_multiple', type: 'boolean' })
  allowsMultiple!: boolean;

  /**
   * Valor de closes at mantenido por la instancia.
   */
  @Property({
    fieldName: 'closes_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closesAt?: Date;

  /**
   * Valor de total votes mantenido por la instancia.
   */
  @Property({ fieldName: 'total_votes', type: 'bigint', nullable: true })
  totalVotes?: string;

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
