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
 * ## Tres formas de nombrar la institución, y las tres conviven
 *
 * `organization_name` es `varchar` a propósito. La mayoría de los hospitales
 * donde trabajó alguien **no están en la plataforma**, y exigir que existan como
 * `directory.tenants` para poder mencionarlos convertiría un dato de currículum
 * en un problema de alta de organizaciones. `practice_site_id` la ata cuando
 * está dentro; `healthFacilityConceptId` cuando está en el padrón oficial del
 * SEDES; el nombre a secas cuando no está en ninguno de los dos.
 *
 * Eso es también lo que la separa de `practice.practitioner_role_assignments`:
 * aquélla dice dónde atiende **hoy dentro de esta plataforma** —y de ahí sale la
 * ubicación que muestra la agenda—; ésta dice dónde trabajó, dentro y fuera.
 *
 * ## Vigencia por fechas; el estado es el de la aprobación
 *
 * `end_date IS NULL` significa que sigue ahí. `statusConceptId` dice otra cosa:
 * si el vínculo está aprobado, pendiente, declarado, rechazado o revocado. Son
 * dos preguntas distintas en dos campos distintos, a propósito — mezclarlas
 * obligaría a mirar los dos para responder cualquiera de las dos.
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
   * Establecimiento del padrón oficial (`VS_BO_HEALTH_FACILITY`: los 503
   * conceptos que publica la API al arrancar, no el paquete de seeds del
   * modelo), cuando el profesional lo eligió de la lista.
   *
   * Convive con `organizationName` y no lo reemplaza: el padrón cubre Santa
   * Cruz, y el resto del país y el extranjero siguen siendo texto libre. De cuál
   * de los dos vino depende qué índice único protege el alta —
   * `ux_practitioner_affiliations_same_health_facility` cuando hay concepto,
   * `ux_practitioner_affiliations_same_organization_name` cuando no—, así que
   * quien busque duplicados antes de insertar tiene que mirar el mismo campo que
   * mira la base. No se migró ningún nombre existente a concepto: la columna se
   * llena hacia adelante.
   */
  @Property({
    fieldName: 'health_facility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  healthFacilityConceptId?: string;

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
   * Estado de la **aprobación** del vínculo: pendiente · declarado · aprobado ·
   * rechazado · revocado (conjunto `practitioner-affiliation-status`).
   *
   * Aprobado sólo si alguien de la organización aprobó; pendiente si hay a quién
   * preguntarle; **declarado** si no hay nadie a quien pedirle permiso — el caso
   * de los hospitales públicos, que nunca van a registrarse y cuyos médicos
   * quedarían bloqueados para siempre esperando una firma que no existe. Que el
   * vínculo siga vigente lo dice `endDate`, no este campo.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Por qué se rechazó o se revocó el vínculo, escrito por quien decidió.
   *
   * **Lo lee el profesional**, no es una nota interna: un rechazo sin motivo es
   * mudo para quien lo recibe. Sólo tiene sentido con `statusConceptId` en
   * rechazado o revocado. Es texto libre porque categorizar motivos que ninguna
   * organización pidió todavía sería inventarlos; el tope lo pone el DTO.
   */
  @Property({
    fieldName: 'decision_reason_text',
    columnType: 'varchar',
    nullable: true,
  })
  decisionReasonText?: string;

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
