import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_affiliations`.
 *
 * ## Qué guarda, y por qué no lo guardaba nada
 *
 * Dónde **trabajó** el profesional: el hospital o la entidad médica, el cargo y
 * el período. El módulo ya modelaba dónde se **formó** (`professional_credentials`),
 * qué puede **ejercer** (`jurisdiction_authorizations`, `practitioner_specialties`)
 * y en qué **idiomas** atiende, pero no su trayectoria laboral. Un `grep` de
 * `affiliation|employer|hospital|workplace` sobre el módulo daba cero.
 *
 * ## La institución es texto, no una clave foránea
 *
 * `organization_name` es `varchar` a propósito. La mayoría de los hospitales
 * donde trabajó alguien **no están en la plataforma**, y exigir que existan como
 * `directory.tenants` para poder mencionarlos convertiría un dato de currículum
 * en un problema de alta de organizaciones. Cuando la institución sí está
 * dentro, `practice_site_id` la ata; cuando no, el nombre alcanza.
 *
 * Eso es también lo que la separa de `practice.practitioner_role_assignments`:
 * aquélla dice dónde atiende **hoy dentro de esta plataforma** —y de ahí sale la
 * ubicación que muestra la agenda—; ésta dice dónde trabajó, dentro y fuera.
 *
 * ## Vigencia por fechas, no por estado
 *
 * `end_date IS NULL` significa que sigue ahí. El `status_concept_id` es del
 * ciclo del registro (activo/retractado), no de la relación laboral: mezclarlos
 * obligaría a mirar dos campos para responder «¿todavía trabaja ahí?».
 */
@Entity({ schema: 'profiles', tableName: 'practitioner_affiliations' })
export class PractitionerAffiliations {
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
   * Nombre de la institución tal como la declara el profesional.
   */
  @Property({ fieldName: 'organization_name', columnType: 'varchar' })
  organizationName!: string;

  /**
   * Sede de la plataforma que corresponde a la institución, si la hay.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /**
   * Cargo ejercido en la institución.
   */
  @Property({ fieldName: 'role_title', columnType: 'varchar' })
  roleTitle!: string;

  /**
   * Servicio o departamento, cuando el cargo no lo dice solo.
   */
  @Property({
    fieldName: 'department_text',
    columnType: 'varchar',
    nullable: true,
  })
  departmentText?: string;

  /**
   * Identificador asociado a affiliation type concept.
   */
  @Property({
    fieldName: 'affiliation_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  affiliationTypeConceptId?: string;

  /**
   * Inicio del vínculo laboral.
   */
  @Property({ fieldName: 'start_date', columnType: 'date' })
  startDate!: Date;

  /**
   * Fin del vínculo. `null` mientras siga ejerciendo ahí.
   */
  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

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
