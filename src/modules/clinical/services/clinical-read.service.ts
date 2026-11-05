import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  getCurrentTenantId,
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import { CONCEPTS } from '../../../common/constants/concepts';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import { SchedulingBookingsRepository } from '../../scheduling/infrastructure/repositories';
import { localDayOf } from '../../scheduling/domain/time/scheduling-time';
import {
  AllergyIntolerancesRepository,
  // BR-14 (CL-11): lectura de reacciones de alergia, independiente del
  // repositorio de M3.
  AllergyReactionsReadRepository,
  CareEpisodesRepository,
  ConditionsRepository,
  EncountersRepository,
  MedicationRequestsRepository,
  ObservationsRepository,
} from '../repositories';
// Los dos repositorios que resuelven «esta historia es tuya»: cuenta → persona
// → perfil. Se proveen en `ClinicalModule` como `scheduling` provee
// `AppointmentsRepository`: son clases sin estado que reciben el
// `EntityManager` por parámetro, así que no duplican fuente de verdad ni
// arrastran el módulo de perfiles entero.
import {
  HealthPractitionerProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
// FT-07-R05/R08: el PDP resuelve si hay grant/relación/representación vigente
// más allá del turno de hoy. `AuthzModule` lo exporta justamente para esto.
import { AuthzPdpService } from '../../authz/services';
// El permiso de lectura no puede depender sólo del turno del día: el PDP
// (`AuthzPdpService`) ya define y evalúa esta base de acceso ("relación
// asistencial vigente") para el resto del sistema. Se provee acá directo —y no
// se importa `AuthzModule` entero— por el mismo criterio que el resto de este
// archivo: es una clase sin estado que recibe el `EntityManager` por
// parámetro, y `authz` no depende de `clinical`, así que no cierra ciclo.
import { CareRelationshipsRepository } from '../../authz/repositories';
import { PatientRepresentationService } from '../../profiles/application/services/patient-representation.service';
// N-04 (BR-13 / M3): toda lectura del resumen clínico deja su fila en
// `audit.data_access_log`, como ya hace el break-the-glass. Repositorio sin
// estado por `EntityManager`, provisto en `ClinicalModule` sin importar más de
// `AuditModule` (que sólo exporta la cadena WORM de mutaciones).
import { DataAccessLogRepository } from '../../audit/repositories';
// BR-14 (CL-10): el motivo del último cambio de estado de una condición vive
// en `audit.conditions_history.data_snapshot` (decisión D-BR14-04, sin
// columna nueva). `HistoryRepository.latestBySource` ya resuelve "última
// revisión por agregado en lote" para cualquier dominio registrado — se
// reutiliza en vez de escribir la misma consulta de nuevo.
import { HistoryRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';
import type { PatientClinicalSummaryResponseDto } from '../dto';
import { hasVerification } from './condition-verification';
import { AUTHZ } from '../../authz/authz.concepts';
import {
  FULL_READ_SCOPE,
  type ClinicalReadScope,
} from '../domain/clinical-read-scope';
import { ClinicalScopeRepository } from '../repositories/clinical-scope.repository';
import { ClinicalGranularScopeService } from './clinical-granular-scope.service';
import { ClinicalScopeFilterService } from './clinical-scope-filter.service';
import {
  groupReactions,
  toAllergyItem,
  toCareEpisodeItem,
  toConditionItem,
  toEncounterItem,
  toMedicationRequestItem,
  toObservationItem,
} from './clinical-summary.mapper';
import {
  loadScopedSummaryRows,
  type SummaryRows,
} from './clinical-summary.scoped';

/** What lets a clinician in: a care relationship (cabecera or other), a consultation or today's booking. */
type AttendanceBasis = 'PRIMARY' | 'ATTENDING' | 'RELATION';

/** Recurso que se asienta en `audit.data_access_log` al leer el resumen. */
const SUMMARY_RESOURCE_TYPE = 'PATIENT_CLINICAL_SUMMARY';
/** Propósito de uso que respalda la lectura del resumen: la atención. */
const SUMMARY_PURPOSE = 'TREATMENT';

/**
 * Cara de lectura del registro clínico (UC-39-20).
 *
 * El módulo `clinical` era íntegramente de escritura: doce endpoints para
 * registrar condiciones, alergias, medicación, procedimientos, inmunizaciones y
 * observaciones, y ninguno para volver a leerlos. Una historia clínica que sólo
 * se puede escribir no es una historia clínica.
 *
 * Devuelve los cinco bloques juntos porque es una sola pantalla —la cabecera
 * clínica del paciente— y porque las alergias, en particular, no deben depender
 * de que el cliente se acuerde de pedirlas en una llamada aparte.
 */
/**
 * Zona con la que se decide «hoy» cuando la sede no declara la suya.
 *
 * IANA real y no un desplazamiento fijo: `-04:00` se rompe el día que una sede opere
 * en una zona con horario de verano, y el resto del módulo de agenda ya razona con
 * nombres IANA. Bolivia no tiene DST, así que `America/La_Paz` ES UTC−4 todo el año —
 * que es lo que se decidió como default.
 *
 * El módulo de agenda cae a `UTC` en otros contextos; acá el default es la zona del
 * producto a propósito: equivocarse por cuatro horas en un límite de día le cierra la
 * historia a quien está atendiendo al paciente.
 */
const DEFAULT_ZONE = 'America/La_Paz';

/**
 * Roles que leen la historia de OTRA persona: los que atienden.
 *
 * Vive acá y no en el controlador porque la decisión entera vive acá: el controlador
 * ya no ramifica. `SUPERADMIN` no está en la lista — tiene su propio camino, explícito,
 * al principio del gate.
 */
const ROLES_THAT_ATTEND: readonly string[] = ['CLINICIAN', 'PRACTITIONER'];
export { ROLES_THAT_ATTEND };

/**
 * Estados de reserva que cuentan como «turno de hoy» para abrir la historia.
 *
 * Incluye los que ya ocurrieron (`IN_PROGRESS`, `COMPLETED`): el profesional que
 * atendió esta mañana sigue necesitando el resumen esta tarde para escribir la
 * evolución. Quedan afuera los que no comprometen —`REQUESTED`, `PENDING_CONFIRM`—
 * y los que dejaron de existir: `CANCELLED` y `NO_SHOW`.
 */
const STATES_THAT_ENABLE: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
  SCHED.BOOKING_IN_PROGRESS,
  SCHED.BOOKING_COMPLETED,
];

/**
 * El 403 de la historia clínica, idéntico para lectura y escritura: no debe
 * distinguir un paciente ajeno de un uuid inventado.
 */
const WITHOUT_ACCESS_TO_HISTORY =
  'Sólo puede consultar su propia historia clínica.';

/** Ventana que se mira alrededor de ahora; el día exacto lo decide la zona de la sede. */
const WINDOW_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class ClinicalReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param conditionsRepo - Acceso a condiciones.
   * @param allergiesRepo - Acceso a alergias e intolerancias.
   * @param medicationRequestsRepo - Acceso a prescripciones.
   * @param observationsRepo - Acceso a observaciones.
   * @param encountersRepo - Acceso a encuentros.
   * @param episodesRepo - Acceso a episodios de cuidado (internaciones).
   * @param careRelationshipsRepo - Acceso a relaciones asistenciales vigentes.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly allergiesRepo: AllergyIntolerancesRepository,
    private readonly allergyReactionsRepo: AllergyReactionsReadRepository,
    private readonly medicationRequestsRepo: MedicationRequestsRepository,
    private readonly observationsRepo: ObservationsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly episodesRepo: CareEpisodesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly practitionerProfilesRepo: HealthPractitionerProfilesRepository,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly pdp: AuthzPdpService,
    private readonly careRelationshipsRepo: CareRelationshipsRepository,
    private readonly logger: PinoLogger,
    // B.1 — la historia de un menor la lee también quien lo representa. Quién
    // representa a quién lo sabe `profiles`; acá sólo se pregunta.
    private readonly representation: PatientRepresentationService,
    // N-04 — la lectura del resumen se asienta en `audit.data_access_log`.
    private readonly dataAccessLogRepo: DataAccessLogRepository,
    // BR-14 (CL-10) — el motivo del último cambio de estado de una condición.
    private readonly historyRepo: HistoryRepository,
    // Narrows a PDP-permitted read to the specialties a patient authorised.
    private readonly granularScope: ClinicalGranularScopeService,
    private readonly scopeFilter: ClinicalScopeFilterService,
    private readonly scopeRepo: ClinicalScopeRepository,
  ) {
    this.logger.setContext(ClinicalReadService.name);
  }

  /**
   * ¿Puede quien pide leer esta historia? Delegates in {@link resolveReadScope}
   * and keeps its signature, so the guard and every caller that only needs the
   * yes/no are unchanged.
   *
   * @throws ForbiddenException si no la atiende ni es su titular.
   */
  async assertCanReadHistory(
    patientProfileId: string,
    actor: AuthenticatedUser,
    scoped?: EntityManager,
  ): Promise<void> {
    await this.resolveReadScope(patientProfileId, actor, scoped);
  }

  /**
   * How much of this history the actor may read (v4.2.2): the whole record or
   * only the specialties a patient authorised. It is the only read gate; the
   * controller does not branch. In this order:
   *
   * 1. `SUPERADMIN` (global only) reads everything.
   * 2. A clinician who attends (consultation in progress, booking of TODAY in
   *    the site's zone, any current care relationship) reads everything.
   * 3. Otherwise the PDP decides (grants, representation). When the access
   *    rests only on granular practitioner-access consents the scope narrows
   *    to the authorised specialties; any other base keeps the full record.
   * 4. Break-the-glass (EMERGENCY) reads everything.
   * 5. The rest falls to {@link assertOwnRecord}: same 403 for a foreign
   *    patient, an invented uuid and an unrelated clinician.
   *
   * The identity is resolved once per request: the unique index of
   * `person_account_links` is commented out in the DDL.
   *
   * @param patientProfileId - La historia que se quiere leer.
   * @param actor - Quién la pide.
   * @param scoped - Manager con el tenant activo ya fijado para RLS, si el
   *        llamador (el guard, antes del interceptor) lo abrió; sin él, un fork.
   * @throws ForbiddenException si no la atiende ni es su titular.
   */
  async resolveReadScope(
    patientProfileId: string,
    actor: AuthenticatedUser,
    scoped?: EntityManager,
  ): Promise<ClinicalReadScope> {
    // Comodín sólo el global, como en `RolesGuard` (#1241).
    if (roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)) {
      return FULL_READ_SCOPE;
    }
    if (!actor.roles.some((role) => ROLES_THAT_ATTEND.includes(role))) {
      await this.assertOwnRecord(patientProfileId, actor);
      return FULL_READ_SCOPE;
    }

    const em = scoped ?? this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const professionalProfile = link
      ? await this.practitionerProfilesRepo.findById(em, link.personId)
      : null;

    if (
      professionalProfile &&
      (await this.attendanceBasis(
        em,
        professionalProfile.profileId,
        patientProfileId,
      ))
    ) {
      return FULL_READ_SCOPE;
    }
    // FT-07-R05/R06/R07/R08: el PDP resuelve el acceso que el paciente autorizó.
    if (
      actor.practitionerProfileId &&
      (await this.hasAuthorizedAccess(em, patientProfileId, actor))
    ) {
      return this.granularScope.resolve(em, patientProfileId, actor);
    }
    // BR-20 / CV-19: break-the-glass is a grant with purpose EMERGENCY, so the
    // TREATMENT question above leaves it out. It is granted to the user, not
    // to the practitioner profile.
    if (
      await this.hasAuthorizedAccess(
        em,
        patientProfileId,
        actor,
        'READ',
        'EMERGENCY',
      )
    ) {
      return FULL_READ_SCOPE;
    }
    await this.assertOwnRecord(patientProfileId, actor, link);
    return FULL_READ_SCOPE;
  }

  /**
   * MCH-007: ¿puede este actor **escribir** en la historia de este paciente?
   *
   * Reading and writing differ in four points:
   *
   * 1. `SUPERADMIN` pasa; sólo un rol que atiende escribe; no hay red de
   *    titularidad.
   * 2. Only the cabecera (`CARE_REL_PRIMARY`) writes on its own.
   * 3. Any other base (care relation that is not the cabecera, a consultation
   *    in progress or today's booking, i.e. `ATTENDING`) does NOT open writing
   *    by itself: it only does so inside an open encounter the actor leads or
   *    attends (rules (a) and (b)). With an `encounterId` it must be that
   *    encounter (`isOwnOpenEncounter`); without one, the actor must have
   *    some own open encounter with the patient (`hasOwnOpenEncounter`).
   * 4. A write-level grant, or a PDP permit with `WRITE` that no care relation
   *    explains, and the break-the-glass grant, write as before. A `READ`
   *    grant never does (`CLINICAL_ACTION_RANK`).
   *
   * The 403 has the read text so it does not tell «not yours» from «missing».
   * Signing is another question, resolved by each service on its own resource.
   *
   * @param patientProfileId - La historia en la que se quiere escribir.
   * @param actor - Quién escribe.
   * @param options - `encounterId`: encounter the write goes into, when the
   *        request has one. `scoped`: manager with the tenant already set for
   *        RLS (as in {@link assertCanReadHistory}); without it, a fork.
   * @throws ForbiddenException si no hay base de escritura sobre ese paciente.
   */
  async assertCanWriteHistory(
    patientProfileId: string,
    actor: AuthenticatedUser,
    options: { encounterId?: string; scoped?: EntityManager } = {},
  ): Promise<void> {
    const { encounterId, scoped } = options;
    if (roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)) return;

    if (actor.roles.some((role) => ROLES_THAT_ATTEND.includes(role))) {
      const em = scoped ?? this.em.fork();
      const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
      const professionalProfile = link
        ? await this.practitionerProfilesRepo.findById(em, link.personId)
        : null;
      const profileId = professionalProfile?.profileId;
      const basis = profileId
        ? await this.attendanceBasis(em, profileId, patientProfileId, true)
        : null;
      if (basis === 'PRIMARY') {
        return;
      }
      // The own open encounter goes before the PDP: it is local and cheaper.
      if (
        profileId &&
        basis !== null &&
        (encounterId
          ? await this.scopeRepo.isOwnOpenEncounter(
              em,
              encounterId,
              patientProfileId,
              profileId,
            )
          : await this.scopeRepo.hasOwnOpenEncounter(
              em,
              patientProfileId,
              profileId,
            ))
      ) {
        return;
      }
      if (
        actor.practitionerProfileId &&
        (await this.hasAuthorizedAccess(
          em,
          patientProfileId,
          actor,
          'WRITE',
        )) &&
        (basis === null ||
          (await this.granularScope.hasWriteLevelGrant(
            em,
            patientProfileId,
            actor,
          )))
      ) {
        return;
      }
      // El grant de emergencia sólo aparece si se pregunta por su propósito.
      if (
        await this.hasAuthorizedAccess(
          em,
          patientProfileId,
          actor,
          'WRITE',
          'EMERGENCY',
        )
      ) {
        return;
      }
    }

    throw new ForbiddenException(WITHOUT_ACCESS_TO_HISTORY);
  }

  /**
   * ¿Hay una base legítima de acceso más allá del turno de hoy?
   *
   * Consulta el PDP de `authz` (`clinical_access_grants` / `care_relationships`
   * / representación legal) para el propósito `TREATMENT`. Nunca lanza: un
   * `DENY` del PDP simplemente deja que {@link assertCanReadHistory} siga a
   * `assertOwnRecord`, que es quien decide el mensaje final.
   */
  private async hasAuthorizedAccess(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
    action: 'READ' | 'WRITE' = 'READ',
    purposeOfUse: 'TREATMENT' | 'EMERGENCY' = 'TREATMENT',
  ): Promise<boolean> {
    const tenantId = actor.tenantIds?.[0];
    if (!tenantId) return false;
    const decision = await this.pdp.evaluate(
      {
        userId: actor.id,
        tenantId,
        resource: 'clinical.patient_record',
        action,
        patientProfileId,
        practitionerProfileId: actor.practitionerProfileId,
        purposeOfUse,
      },
      actor,
      em,
    );
    return decision.decision === 'PERMIT';
  }

  /**
   * ¿En qué se apoya el profesional para atender a esta persona? (`null`: en nada)
   *
   * Writing (`cabeceraFirst`) looks at the cabecera first so a write is never
   * narrowed for the practitioner who leads the care; reading keeps the cheap
   * checks first:
   *
   * 1. `PRIMARY`: ACTIVE `CARE_REL_PRIMARY` relation, in its window, with no
   *    purpose (ALV-029).
   * 2. `ATTENDING`: a consultation in progress (the practitioner pressed
   *    «Iniciar consulta», corrección #15) or a live booking that falls today
   *    in the site's zone.
   * 3. `RELATION`: any other current relation (treating, consulting,
   *    emergency, from check-in or `/request`).
   *
   * Reading treats the three alike. Writing does not: see
   * {@link assertCanWriteHistory}.
   */
  private async attendanceBasis(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
    cabeceraFirst = false,
  ): Promise<AttendanceBasis | null> {
    const attending = async () =>
      (await this.bookingsRepo.hasConsultationInProgress(
        em,
        practitionerProfileId,
        patientProfileId,
        SCHED.BOOKING_IN_PROGRESS,
      )) ||
      (await this.attendsToday(em, practitionerProfileId, patientProfileId));
    // Reading: the cheap checks go first, any base opens the record.
    if (!cabeceraFirst && (await attending())) return 'ATTENDING';
    const relations = await this.currentRelations(
      em,
      practitionerProfileId,
      patientProfileId,
    );
    const primary = relations.some(
      (relation) =>
        relation.relationshipTypeConceptId === AUTHZ.CARE_REL_PRIMARY,
    );
    if (primary) return 'PRIMARY';
    if (cabeceraFirst && (await attending())) return 'ATTENDING';
    return relations.length > 0 ? 'RELATION' : null;
  }

  /**
   * ACTIVE care relations, inside their `valid_from`/`valid_to` window and with
   * no purpose (ALV-029). The window is checked here, like
   * `AuthzPdpService.isWithinWindow`. A relation bound to a purpose is dropped:
   * this gate receives no purpose to compare with (fail-closed, as the PDP).
   */
  private async currentRelations(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
  ) {
    const now = Date.now();
    const relations =
      await this.careRelationshipsRepo.findActiveForPractitionerPatient(
        em,
        practitionerProfileId,
        patientProfileId,
      );
    return relations.filter(
      (relation) =>
        !relation.purposeConceptId &&
        relation.validFrom.getTime() <= now &&
        !(relation.validTo && relation.validTo.getTime() <= now),
    );
  }

  /**
   * ¿Tiene el profesional una reserva viva con ese paciente, hoy en la sede?
   *
   * Se traen las reservas de una ventana amplia alrededor de ahora y se compara el día
   * **fila por fila** con la zona de su recurso: dos sedes del mismo profesional pueden
   * estar en zonas distintas, así que no hay una sola ventana UTC que sirva para todas.
   *
   * @param em - Contexto de persistencia.
   * @param practitionerProfileId - El profesional que pide.
   * @param patientProfileId - El paciente cuya historia se pide.
   * @returns `true` si alguna reserva viva cae hoy en la zona de su sede.
   */
  private async attendsToday(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
  ): Promise<boolean> {
    const now = new Date();
    const reservations =
      await this.bookingsRepo.findConfirmedWithPatientBetween(
        em,
        practitionerProfileId,
        patientProfileId,
        new Date(now.getTime() - WINDOW_MS),
        new Date(now.getTime() + WINDOW_MS),
        STATES_THAT_ENABLE,
      );

    return reservations.some((reservation) => {
      const zone = reservation.timeZone ?? DEFAULT_ZONE;
      const today = localDayOf(now, zone);
      const day = localDayOf(reservation.startAt, zone);
      return (
        day.year === today.year &&
        day.month === today.month &&
        day.day === today.day
      );
    });
  }

  /**
   * Exige que la historia pedida sea **la propia** (carril 09).
   *
   * ## Por qué se resuelve contra la base y no contra el token
   *
   * El claim `pid` existe, pero su propia documentación dice que **no es una
   * credencial y no participa de ninguna decisión de autorización**. Usarlo acá
   * convertiría un dato de comodidad —puesto en el token para que el portal no
   * tuviera que pedirlo— en la única barrera que separa la historia clínica de
   * una persona de la de otra.
   *
   * Así que se resuelve como lo resuelve el resto del sistema: del vínculo
   * activo entre la cuenta y su persona, y de ahí al perfil. Son dos consultas
   * y ocurren una vez por lectura.
   *
   * ## Qué se compara, y por qué se comparaba mal
   *
   * `patient_profiles.profile_id` **es** el identificador de la persona: los
   * subtipos de `profiles` se identifican por ella y no por una fila
   * intermedia. Es la regla que `ProfileOwnershipService` ya declara para los
   * mismos perfiles, y la que esta comprobación se había apartado: buscaba en
   * `person_profiles` **por su `id`** usando un id de persona. Esa fila no
   * existe nunca, así que el titular quedaba fuera de su propia historia con un
   * 403 permanente — no en un caso borde, en todos.
   *
   * Comprobado sobre la base: de 16 perfiles de paciente, los 16 tienen
   * `profile_id` apuntando a una persona y ninguno a un `person_profiles.id`.
   *
   * ## Qué NO relaja el bypass de verificación
   *
   * Esto. El bypass de DEV (corrección #12) exime de estar verificado, no de
   * ser el titular: un paciente sin verificar ve su historia, y ninguna otra.
   *
   * @param patientProfileId - La historia que se quiere leer.
   * @param actor - Quién la pide.
   * @throws ForbiddenException si no es la suya.
   */
  async assertOwnRecord(
    patientProfileId: string,
    actor: AuthenticatedUser,
    linkResolved?: Awaited<
      ReturnType<PersonAccountLinksRepository['findActiveByUser']>
    >,
  ): Promise<void> {
    const em = this.em.fork();
    // El vínculo puede venir ya resuelto del gate: la base no garantiza que sea
    // único (su índice vive comentado), así que resolverlo dos veces en la misma
    // petición podría devolver personas distintas.
    const link =
      linkResolved !== undefined
        ? linkResolved
        : await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const profile = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );

    if (!link || !profile || profile.profileId !== link.personId) {
      // No es la suya, pero puede ser la de alguien a quien representa (B.1):
      // la madre que pidió el turno de su hijo tiene que poder leer lo que el
      // pediatra escribió. Se pregunta recién acá —y no antes— para que el caso
      // normal, el titular leyendo lo suyo, no pague una consulta de más.
      if (
        await this.representation.representsPatient(patientProfileId, actor)
      ) {
        return;
      }

      this.logger.warn(
        {
          operation: 'clinical.patient.read.denied',
          patientProfileId,
          userId: actor.id,
        },
        'Intento de leer una historia clínica ajena',
      );
      // El mensaje no cambia: quien no puede leerla no tiene por qué distinguir
      // «no sos el titular» de «no lo representás» ni de «ese paciente no
      // existe». Las tres cosas se dicen igual.
      throw new ForbiddenException(WITHOUT_ACCESS_TO_HISTORY);
    }
  }

  /**
   * UC-39-20: historial clínico del paciente.
   *
   * N-04 (BR-13): the read leaves a row in `audit.data_access_log` (who, which
   * patient, which purpose; identifiers only) BEFORE anything is returned: if
   * the row cannot be written the summary is not served (fail-closed).
   *
   * With a SPECIALTIES scope the three IPS sections (allergies, active
   * conditions, active medication requests) always come; the rest only when
   * its responsible practitioner holds an authorised specialty. The filter runs
   * in SQL and `hiddenByScope` counts what it kept out, so the client does not
   * show «none» where there is data it may not read.
   *
   * @param patientProfileId - Paciente cuyo historial se lee.
   * @param limit - Tope por bloque.
   * @param actor - Quién lee; ya autorizado por `ClinicalRecordAccessGuard`.
   * @param scope - Alcance que dejó el guard. Si no llega se calcula acá: un
   *                alcance ausente nunca se asume completo.
   */
  async getPatientSummary(
    patientProfileId: string,
    limit: number,
    actor: AuthenticatedUser,
    scope?: ClinicalReadScope,
  ): Promise<PatientClinicalSummaryResponseDto> {
    this.logger.info(
      { operation: 'clinical.patient.read', patientProfileId, limit },
      'Leyendo historial clínico del paciente',
    );
    const readScope =
      scope ?? (await this.resolveReadScope(patientProfileId, actor));

    const em = this.em.fork({ keepTransactionContext: true });
    const over = limit + 1;

    this.dataAccessLogRepo.record(em, {
      userId: actor.id,
      actionConceptId: AUD.ACTION_READ,
      patientProfileId,
      tenantId: getCurrentTenantId(),
      purpose: SUMMARY_PURPOSE,
      resourceType: SUMMARY_RESOURCE_TYPE,
      resourceId: patientProfileId,
      recordedByUserId: actor.id,
    });
    await em.flush();

    const filter = await this.scopeFilter.build(
      em,
      patientProfileId,
      readScope,
    );
    const rows = filter
      ? await loadScopedSummaryRows(
          em,
          this.scopeRepo,
          this.allergiesRepo,
          patientProfileId,
          over,
          filter,
        )
      : await this.loadAllRows(em, patientProfileId, over);

    const truncated: string[] = [];
    const cutConditions = this.cut(
      rows.conditions,
      limit,
      'conditions',
      truncated,
    );
    const cutAllergies = this.cut(
      rows.allergies,
      limit,
      'allergies',
      truncated,
    );
    const conditionIds = cutConditions.map((c) => c.id);

    // BR-14 (CL-10): motivo del último cambio de estado, desde `data_snapshot`.
    const conditionHistory = await this.historyRepo.latestBySource(
      em,
      'conditions',
      conditionIds,
    );
    // C3 / P41: la decisión de verificación, de la última revisión que la trae.
    const verificationHistory = await this.historyRepo.latestBySource(
      em,
      'conditions',
      conditionIds,
      (revision) => hasVerification(revision.dataSnapshot),
    );
    // BR-14 (CL-11): reacciones de cada alergia, en lote.
    const reactions = groupReactions(
      await this.allergyReactionsRepo.findByAllergyIds(
        em,
        cutAllergies.map((a) => a.id),
      ),
    );

    return {
      patientProfileId,
      conditions: cutConditions.map((row) =>
        toConditionItem(row, conditionHistory, verificationHistory),
      ),
      allergies: cutAllergies.map((row) => toAllergyItem(row, reactions)),
      medicationRequests: this.cut(
        rows.medicationRequests,
        limit,
        'medicationRequests',
        truncated,
      ).map(toMedicationRequestItem),
      observations: this.cut(
        rows.observations,
        limit,
        'observations',
        truncated,
      ).map(toObservationItem),
      encounters: this.cut(rows.encounters, limit, 'encounters', truncated).map(
        toEncounterItem,
      ),
      careEpisodes: this.cut(
        rows.careEpisodes,
        limit,
        'careEpisodes',
        truncated,
      ).map(toCareEpisodeItem),
      limit,
      truncated,
      hiddenByScope: rows.hiddenByScope,
    };
  }

  private async loadAllRows(
    em: EntityManager,
    patientProfileId: string,
    over: number,
  ): Promise<SummaryRows> {
    const [
      conditions,
      allergies,
      medicationRequests,
      observations,
      encounters,
      careEpisodes,
    ] = await Promise.all([
      this.conditionsRepo.findByPatient(em, patientProfileId, over),
      this.allergiesRepo.findByPatient(em, patientProfileId, over),
      this.medicationRequestsRepo.findByPatient(em, patientProfileId, over),
      this.observationsRepo.findByPatient(em, patientProfileId, over),
      this.encountersRepo.findByPatient(em, patientProfileId, over),
      this.episodesRepo.findByPatient(em, patientProfileId, over),
    ]);
    return {
      conditions,
      allergies,
      medicationRequests,
      observations,
      encounters,
      careEpisodes,
    };
  }

  /**
   * Recorta el bloque al tope y anota su nombre si sobraba.
   *
   * @param rows - Filas leídas, con una de más.
   * @param limit - Tope del bloque.
   * @param name - Nombre del bloque en la respuesta.
   * @param truncated - Acumulador de bloques recortados.
   * @returns Las filas del bloque, ya recortadas.
   */
  private cut<T>(
    rows: T[],
    limit: number,
    name: string,
    truncated: string[],
  ): T[] {
    if (rows.length > limit) {
      truncated.push(name);
      return rows.slice(0, limit);
    }
    return rows;
  }
}
