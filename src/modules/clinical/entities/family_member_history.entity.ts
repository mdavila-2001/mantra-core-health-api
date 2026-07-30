import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `family_member_history`.
 */
@Entity({ schema: 'clinical', tableName: 'family_member_history' })
export class FamilyMemberHistory {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a relationship concept.
   */
  @Property({ fieldName: 'relationship_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationshipConceptId!: string;

  /**
   * Identificador asociado a condition concept.
   */
  @Property({ fieldName: 'condition_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  conditionConceptId?: string;

  /**
   * Valor de onset age years mantenido por la instancia.
   */
  @Property({ fieldName: 'onset_age_years', columnType: 'int', nullable: true })
  onsetAgeYears?: number;

  /**
   * Valor de deceased mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  deceased?: boolean;

  /**
   * Valor de deceased age years mantenido por la instancia.
   */
  @Property({
    fieldName: 'deceased_age_years',
    columnType: 'int',
    nullable: true,
  })
  deceasedAgeYears?: number;

  /**
   * Valor de note text mantenido por la instancia.
   */
  @Property({ fieldName: 'note_text', columnType: 'text', nullable: true })
  noteText?: string;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

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
