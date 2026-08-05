import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_practitioner_profiles`.
 */
@Entity({ schema: 'profiles', tableName: 'health_practitioner_profiles' })
export class HealthPractitionerProfiles {
  /**
   * Identificador asociado a profile.
   */
  @PrimaryKey({ fieldName: 'profile_id', type: 'uuid' })
  profileId: string = randomUUID();

  /**
   * Valor de practitioner code mantenido por la instancia.
   */
  @Property({ fieldName: 'practitioner_code', columnType: 'varchar' })
  practitionerCode!: string;

  /**
   * Identificador asociado a practitioner category concept.
   */
  @Property({ fieldName: 'practitioner_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  practitionerCategoryConceptId!: string;

  /**
   * Valor de professional title mantenido por la instancia.
   */
  @Property({
    fieldName: 'professional_title',
    columnType: 'varchar',
    nullable: true,
  })
  professionalTitle?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  /**
   * Identificador asociado a practice status concept.
   */
  @Property({ fieldName: 'practice_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  practiceStatusConceptId!: string;

  /**
   * Valor de professional bio mantenido por la instancia.
   */
  @Property({
    fieldName: 'professional_bio',
    columnType: 'text',
    nullable: true,
  })
  professionalBio?: string;

  /**
   * Identificador asociado a photo file.
   */
  @Property({ fieldName: 'photo_file_id', type: 'uuid', nullable: true }) // FK → common.files
  photoFileId?: string;

  /**
   * Valor de accepts new patients mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepts_new_patients',
    type: 'boolean',
    nullable: true,
  })
  acceptsNewPatients?: boolean;

  /**
   * Valor de telehealth available mantenido por la instancia.
   */
  @Property({
    fieldName: 'telehealth_available',
    type: 'boolean',
    nullable: true,
  })
  telehealthAvailable?: boolean;

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
