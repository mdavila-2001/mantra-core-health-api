import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `encounter_participants`.
 */
@Entity({ schema: 'clinical', tableName: 'encounter_participants' })
export class EncounterParticipants {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid' }) // FK → clinical.encounters
  encounterId!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * Identificador asociado a participant role concept.
   */
  @Property({ fieldName: 'participant_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  participantRoleConceptId!: string;

  /**
   * Identificador asociado a practitioner role assignment.
   */
  @Property({
    fieldName: 'practitioner_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments
  practitionerRoleAssignmentId?: string;

  /**
   * Valor de period start mantenido por la instancia.
   */
  @Property({
    fieldName: 'period_start',
    columnType: 'timestamptz',
    nullable: true,
  })
  periodStart?: Date;

  /**
   * Valor de period end mantenido por la instancia.
   */
  @Property({
    fieldName: 'period_end',
    columnType: 'timestamptz',
    nullable: true,
  })
  periodEnd?: Date;

  /**
   * Valor de is responsible mantenido por la instancia.
   */
  @Property({ fieldName: 'is_responsible', type: 'boolean', nullable: true })
  isResponsible?: boolean;

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
