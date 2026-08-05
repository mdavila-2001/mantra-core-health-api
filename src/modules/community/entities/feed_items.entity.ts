import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `feed_items`.
 */
@Entity({ schema: 'community', tableName: 'feed_items' })
export class FeedItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a owner profile.
   */
  @Property({ fieldName: 'owner_profile_id', type: 'uuid' }) // FK → community.public_profiles
  ownerProfileId!: string;

  /**
   * Identificador asociado a item type concept.
   */
  @Property({ fieldName: 'item_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  itemTypeConceptId!: string;

  /**
   * Identificador asociado a source type concept.
   */
  @Property({ fieldName: 'source_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceTypeConceptId!: string;

  /**
   * Identificador asociado a source ref.
   */
  @Property({ fieldName: 'source_ref_id', type: 'uuid' })
  sourceRefId!: string;

  /**
   * Identificador asociado a origin concept.
   */
  @Property({ fieldName: 'origin_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  originConceptId!: string;

  /**
   * Valor de rank score mantenido por la instancia.
   */
  @Property({ fieldName: 'rank_score', columnType: 'numeric', nullable: true })
  rankScore?: string;

  /**
   * Valor de is seen mantenido por la instancia.
   */
  @Property({ fieldName: 'is_seen', type: 'boolean', nullable: true })
  isSeen?: boolean;

  /**
   * Valor de is hidden mantenido por la instancia.
   */
  @Property({ fieldName: 'is_hidden', type: 'boolean', nullable: true })
  isHidden?: boolean;

  /**
   * Valor de surfaced at mantenido por la instancia.
   */
  @Property({
    fieldName: 'surfaced_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  surfacedAt?: Date;

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
