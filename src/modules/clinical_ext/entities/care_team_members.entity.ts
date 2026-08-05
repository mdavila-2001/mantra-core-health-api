import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `care_team_members`.
 */
@Entity({ schema: 'clinical_ext', tableName: 'care_team_members' })
export class CareTeamMembers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a care team.
   */
  @Property({ fieldName: 'care_team_id', type: 'uuid' }) // FK → clinical_ext.care_teams
  careTeamId!: string;

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
   * Identificador asociado a related person.
   */
  @Property({ fieldName: 'related_person_id', type: 'uuid', nullable: true }) // FK → profiles.related_persons
  relatedPersonId?: string;

  /**
   * Identificador asociado a member role concept.
   */
  @Property({ fieldName: 'member_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberRoleConceptId!: string;

  /**
   * Valor de is responsible mantenido por la instancia.
   */
  @Property({ fieldName: 'is_responsible', type: 'boolean', nullable: true })
  isResponsible?: boolean;

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
