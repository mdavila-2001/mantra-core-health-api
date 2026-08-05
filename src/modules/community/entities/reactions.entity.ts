import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `reactions`.
 */
@Entity({ schema: 'community', tableName: 'reactions' })
export class Reactions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a actor profile.
   */
  @Property({ fieldName: 'actor_profile_id', type: 'uuid' }) // FK → community.public_profiles
  actorProfileId!: string;

  /**
   * Identificador asociado a reactable type concept.
   */
  @Property({ fieldName: 'reactable_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reactableTypeConceptId!: string;

  /**
   * Identificador asociado a reactable ref.
   */
  @Property({ fieldName: 'reactable_ref_id', type: 'uuid' })
  reactableRefId!: string;

  /**
   * Identificador asociado a reaction type concept.
   */
  @Property({ fieldName: 'reaction_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reactionTypeConceptId!: string;

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
