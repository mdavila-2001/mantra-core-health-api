import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_languages`.
 */
@Entity({ schema: 'profiles', tableName: 'practitioner_languages' })
export class PractitionerLanguages {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practitioner profile.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * Identificador asociado a language concept.
   */
  @Property({ fieldName: 'language_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  languageConceptId!: string;

  /**
   * Identificador asociado a proficiency concept.
   */
  @Property({
    fieldName: 'proficiency_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  proficiencyConceptId?: string;

  /**
   * Valor de clinical interpretation allowed mantenido por la instancia.
   */
  @Property({
    fieldName: 'clinical_interpretation_allowed',
    type: 'boolean',
    nullable: true,
  })
  clinicalInterpretationAllowed?: boolean;

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
