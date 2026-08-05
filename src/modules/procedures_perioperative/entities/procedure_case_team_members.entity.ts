import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_case_team_members`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_team_members',
})
export class ProcedureCaseTeamMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  /**
   * Identificador asociado a practitioner profile.
   */
  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  /**
   * Identificador asociado a team role concept.
   */
  @Property({ fieldName: 'team_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  teamRoleConceptId!: string;

  /**
   * Valor de assigned at mantenido por la instancia.
   */
  @Property({
    fieldName: 'assigned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  assignedAt?: Date;

  /**
   * Valor de accepted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acceptedAt?: Date;

  /**
   * Valor de arrived at mantenido por la instancia.
   */
  @Property({
    fieldName: 'arrived_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  arrivedAt?: Date;

  /**
   * Valor de departed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'departed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  departedAt?: Date;

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
