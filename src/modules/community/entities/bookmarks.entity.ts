import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `bookmarks`.
 */
@Entity({ schema: 'community', tableName: 'bookmarks' })
export class Bookmarks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a profile.
   */
  @Property({ fieldName: 'profile_id', type: 'uuid' }) // FK → community.public_profiles
  profileId!: string;

  /**
   * Identificador asociado a bookmarkable type concept.
   */
  @Property({ fieldName: 'bookmarkable_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  bookmarkableTypeConceptId!: string;

  /**
   * Identificador asociado a bookmarkable ref.
   */
  @Property({ fieldName: 'bookmarkable_ref_id', type: 'uuid' })
  bookmarkableRefId!: string;

  /**
   * Valor de collection name mantenido por la instancia.
   */
  @Property({
    fieldName: 'collection_name',
    columnType: 'varchar',
    nullable: true,
  })
  collectionName?: string;

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
