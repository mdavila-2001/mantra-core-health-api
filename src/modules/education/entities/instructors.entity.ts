import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `instructors`.
 */
@Entity({ schema: 'education', tableName: 'instructors' })
export class Instructors {
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
   * Identificador asociado a practitioner profile.
   */
  @Property({
    fieldName: 'practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId?: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid', nullable: true }) // FK → iam.users
  userId?: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  /**
   * Valor de bio mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  bio?: string;

  /**
   * Valor de credentials text mantenido por la instancia.
   */
  @Property({
    fieldName: 'credentials_text',
    columnType: 'varchar',
    nullable: true,
  })
  credentialsText?: string;

  /**
   * Identificador asociado a photo file.
   */
  @Property({ fieldName: 'photo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  photoFileId?: string;

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
