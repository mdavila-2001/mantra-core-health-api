import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `related_persons`.
 */
@Entity({ schema: 'profiles', tableName: 'related_persons' })
export class RelatedPersons {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a person.
   */
  @Property({ fieldName: 'person_id', type: 'uuid' }) // FK → profiles.persons
  personId!: string;

  /**
   * Identificador asociado a relationship concept.
   */
  @Property({ fieldName: 'relationship_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipConceptId!: string;

  /**
   * Valor de is emergency contact mantenido por la instancia.
   */
  @Property({ fieldName: 'is_emergency_contact', type: 'boolean' })
  isEmergencyContact!: boolean;

  /**
   * Valor de is legal guardian mantenido por la instancia.
   */
  @Property({ fieldName: 'is_legal_guardian', type: 'boolean' })
  isLegalGuardian!: boolean;

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
