import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `public_profiles`.
 */
@Entity({ schema: 'community', tableName: 'public_profiles' })
export class PublicProfiles {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a target type concept.
   */
  @Property({ fieldName: 'target_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  targetTypeConceptId!: string;

  /**
   * Identificador asociado a target.
   */
  @Property({ fieldName: 'target_id', type: 'uuid' })
  targetId!: string;

  /**
   * Valor de slug mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  slug!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  /**
   * Valor de headline mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  headline?: string;

  /**
   * Valor de biography mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  biography?: string;

  /**
   * Identificador asociado a avatar file.
   */
  @Property({ fieldName: 'avatar_file_id', type: 'uuid', nullable: true }) // FK → common.files
  avatarFileId?: string;

  /**
   * Identificador asociado a cover file.
   */
  @Property({ fieldName: 'cover_file_id', type: 'uuid', nullable: true }) // FK → common.files
  coverFileId?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({
    fieldName: 'verification_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  verificationStatusConceptId?: string;

  /**
   * Identificador asociado a visibility concept.
   */
  @Property({
    fieldName: 'visibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  visibilityConceptId?: string;

  /**
   * Valor de accepts reviews mantenido por la instancia.
   */
  @Property({ fieldName: 'accepts_reviews', type: 'boolean', nullable: true })
  acceptsReviews?: boolean;

  /**
   * Valor de comments default enabled mantenido por la instancia.
   */
  @Property({
    fieldName: 'comments_default_enabled',
    type: 'boolean',
    nullable: true,
  })
  commentsDefaultEnabled?: boolean;

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
