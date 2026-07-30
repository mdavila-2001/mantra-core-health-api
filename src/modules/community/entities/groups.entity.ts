import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `groups`.
 */
@Entity({ schema: 'community', tableName: 'groups' })
export class Groups {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de slug mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  slug!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a visibility concept.
   */
  @Property({ fieldName: 'visibility_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  visibilityConceptId!: string;

  /**
   * Identificador asociado a group type concept.
   */
  @Property({ fieldName: 'group_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  groupTypeConceptId!: string;

  /**
   * Identificador asociado a topic.
   */
  @Property({ fieldName: 'topic_id', type: 'uuid', nullable: true }) // FK → community.topics
  topicId?: string;

  /**
   * Identificador asociado a owner profile.
   */
  @Property({ fieldName: 'owner_profile_id', type: 'uuid', nullable: true }) // FK → community.public_profiles
  ownerProfileId?: string;

  /**
   * Identificador asociado a cover file.
   */
  @Property({ fieldName: 'cover_file_id', type: 'uuid', nullable: true }) // FK → common.files
  coverFileId?: string;

  /**
   * Valor de member count mantenido por la instancia.
   */
  @Property({ fieldName: 'member_count', columnType: 'int', nullable: true })
  memberCount?: number;

  /**
   * Valor de post count mantenido por la instancia.
   */
  @Property({ fieldName: 'post_count', columnType: 'int', nullable: true })
  postCount?: number;

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
