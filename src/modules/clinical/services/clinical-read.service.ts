import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { getCurrentTenantId, type AuthenticatedUser } from '../../../common';
import { CONCEPTS } from '../../../common/constants/concepts';
import { SCHED } from '../../scheduling/scheduling.concepts';
import { SchedulingBookingsRepository } from '../../scheduling/repositories';
import { diaLocalDe } from '../../scheduling/scheduling-time';
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
} from '../../profiles/repositories';
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
import { PatientRepresentationService } from '../../profiles/services/patient-representation.service';
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
const ZONA_POR_DEFECTO = 'America/La_Paz';

/**
 * Roles que leen la historia de OTRA persona: los que atienden.
 *
 * Vive acá y no en el controlador porque la decisión entera vive acá: el controlador
 * ya no ramifica. `SUPERADMIN` no está en la lista — tiene su propio camino, explícito,
 * al principio del gate.
 */
const ROLES_QUE_ATIENDEN: readonly string[] = ['CLINICIAN', 'PRACTITIONER'];

/**
 * Estados de reserva que cuentan como «turno de hoy» para abrir la historia.
 *
 * Incluye los que ya ocurrieron (`IN_PROGRESS`, `COMPLETED`): el profesional que
 * atendió esta mañana sigue necesitando el resumen esta tarde para escribir la
 * evolución. Quedan afuera los que no comprometen —`REQUESTED`, `PENDING_CONFIRM`—
 * y los que dejaron de existir: `CANCELLED` y `NO_SHOW`.
 */
const ESTADOS_QUE_HABILITAN: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
  SCHED.BOOKING_IN_PROGRESS,
  SCHED.BOOKING_COMPLETED,
];

/**
 * El 403 de la historia clínica, idéntico para lectura y escritura: no debe
 * distinguir un paciente ajeno de un uuid inventado.
 */
const SIN_ACCESO_A_LA_HISTORIA =
  'Sólo podés consultar tu propia historia clínica.';

/** Ventana que se mira alrededor de ahora; el día exacto lo decide la zona de la sede. */
const VENTANA_MS = 48 * 60 * 60 * 1000;

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
  ) {
    this.logger.setContext(ClinicalReadService.name);
  }

  /**
   * Decide si quien pide puede leer esta historia (v4.2.2).
   *
   * Es la única puerta del resumen clínico: el controlador no ramifica. Tres caminos,
   * en este orden.
   *
   * ## 1 · `SUPERADMIN` pasa
   *
   * El `RolesGuard` ya lo trata como comodín en toda la API; negárselo acá sería
   * contradecir al guard que lo dejó entrar. **Queda como pregunta abierta de producto**:
   * si el soporte no debe leer PHI sin turno, se saca de acá y se decide qué lo
   * reemplaza — hoy hay pruebas de integración que dependen de este acceso.
   *
   * ## 2 · Quien atiende: turno de HOY con ESE paciente, o relación asistencial vigente
   *
   * Antes pasaba cualquiera con el rol. El comentario que lo justificaba decía que a
   * quién puede atender lo decide la asignación de roles «y no este endpoint» — pero esa
   * asignación no existía: la tabla de permisos por paciente está vacía y nadie la
   * consulta. En los hechos, cualquier médico con sesión leía la historia de cualquier
   * persona. Esta es la regla mínima defendible mientras el grupo define el modelo de
   * consentimiento: **nace del turno confirmado, o de una relación asistencial que
   * `authz` ya declara vigente** (ALV-029: sin esta segunda vía, un profesional con
   * paciente asignado pero sin cupo agendado para hoy caía en {@link assertOwnRecord}
   * como un desconocido).
   *
   * «Hoy» es el día de la SEDE, no el del servidor. Un turno de las 23:30 en La Paz ya
   * cayó en «mañana» para UTC, y con la fecha del servidor el profesional se quedaría
   * sin la historia del paciente que tiene enfrente.
   *
   * ## 3 · El resto, y el profesional sin turno: titularidad
   *
   * Cae en {@link assertOwnRecord}, que responde el **mismo 403 con el mismo texto** a
   * un paciente ajeno, a un uuid inventado y a un profesional sin turno. Que sean
   * indistinguibles es deliberado: un mensaje que diferenciara «no es tuya» de «no la
   * atendés hoy» confirmaría la existencia del paciente a quien sólo probó un uuid.
   * Sirve además de red para el profesional que pide su PROPIA historia.
   *
   * ## La identidad se resuelve una sola vez
   *
   * `uq_person_account_links_active_user` vive comentado en el DDL (su predicado usa
   * funciones que el modelo nunca definió), así que la base **no garantiza** un solo
   * vínculo activo por cuenta y `findActiveByUser` devolvería una fila arbitraria si
   * hubiera dos. Resolver dos veces en la misma petición podría dar dos personas
   * distintas, así que se resuelve una y se reutiliza.
   *
   * @param patientProfileId - La historia que se quiere leer.
   * @param actor - Quién la pide.
   * @throws ForbiddenException si no la atiende hoy ni es su titular.
   */
  async assertPuedeLeerHistoria(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.roles.includes('SUPERADMIN')) return;

    if (!actor.roles.some((rol) => ROLES_QUE_ATIENDEN.includes(rol))) {
      await this.assertOwnRecord(patientProfileId, actor);
      return;
    }

    const em = this.em.fork();
    const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const perfilProfesional = link
      ? await this.practitionerProfilesRepo.findById(em, link.personId)
      : null;

    if (
      perfilProfesional &&
      (await this.estaAtendiendo(
        em,
        perfilProfesional.profileId,
        patientProfileId,
      ))
    ) {
      return;
    }

    // FT-07-R05/R06/R07/R08: sin turno hoy, todavía puede haber una relación
    // asistencial o un acceso clínico que el paciente autorizó explícitamente
    // —el flujo de `POST /authz/care-relationships/request` +
    // `.../respond`— o una representación legal vigente. El PDP de `authz` ya
    // resuelve exactamente esa pregunta; se consulta acá para no reimplementar
    // la evaluación (deny-overrides, vigencia, propósito) en dos lugares.
    if (
      actor.practitionerProfileId &&
      (await this.tieneAccesoAutorizado(patientProfileId, actor))
    ) {
      return;
    }

    // Sin turno hoy ni autorización vigente no alcanza el rol; queda la
    // titularidad, que además cubre al profesional que lee su propia historia.
    await this.assertOwnRecord(patientProfileId, actor, link);
  }

  /**
   * MCH-007: ¿puede este actor **escribir** en la historia de este paciente?
   *
   * Hasta ahora las escrituras del expediente pasaban por
   * {@link assertPuedeLeerHistoria}, que le pregunta al PDP por `READ`: un
   * grant de sólo lectura —el que crea el paciente al aprobar una solicitud de
   * acceso (`practitioner-access-requests`)— alcanzaba para escribir. Y su
   * último recurso, la titularidad, dejaba al profesional escribir en su propia
   * historia.
   *
   * La escritura pide lo mismo que la lectura salvo en esas dos cosas:
   *
   * 1. `SUPERADMIN` pasa, igual que en el resto del sistema de roles.
   * 2. Sólo un rol que atiende escribe. Un paciente no escribe su expediente.
   * 3. Estar atendiendo —consulta en curso, turno vivo de hoy o relación
   *    asistencial vigente— habilita, con el mismo criterio que la lectura.
   * 4. Sin eso, el PDP con la acción **`WRITE`**: un grant `READ` no alcanza el
   *    rango (`CLINICAL_ACTION_RANK`), uno `WRITE`/`FULL` sí.
   * 5. No hay red de titularidad: nadie escribe su propia historia por serlo.
   *
   * El 403 lleva el mismo texto que el de la lectura para que no distinga
   * «no es tuya» de «no existe».
   *
   * Firmar es otra pregunta —quién firma—, y cada servicio la resuelve contra
   * su propio recurso: poder escribir no es poder firmar por otro profesional.
   *
   * @param patientProfileId - La historia en la que se quiere escribir.
   * @param actor - Quién escribe.
   * @throws ForbiddenException si no hay base de escritura sobre ese paciente.
   */
  async assertPuedeEscribirHistoria(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.roles.includes('SUPERADMIN')) return;

    if (actor.roles.some((rol) => ROLES_QUE_ATIENDEN.includes(rol))) {
      const em = this.em.fork();
      const link = await this.accountLinksRepo.findActiveByUser(em, actor.id);
      const perfilProfesional = link
        ? await this.practitionerProfilesRepo.findById(em, link.personId)
        : null;
      if (
        perfilProfesional &&
        (await this.estaAtendiendo(
          em,
          perfilProfesional.profileId,
          patientProfileId,
        ))
      ) {
        return;
      }
      if (
        actor.practitionerProfileId &&
        (await this.tieneAccesoAutorizado(patientProfileId, actor, 'WRITE'))
      ) {
        return;
      }
    }

    throw new ForbiddenException(SIN_ACCESO_A_LA_HISTORIA);
  }

  /**
   * ¿Hay una base legítima de acceso más allá del turno de hoy?
   *
   * Consulta el PDP de `authz` (`clinical_access_grants` / `care_relationships`
   * / representación legal) para el propósito `TREATMENT`. Nunca lanza: un
   * `DENY` del PDP simplemente deja que {@link assertPuedeLeerHistoria} siga a
   * `assertOwnRecord`, que es quien decide el mensaje final.
   */
  private async tieneAccesoAutorizado(
    patientProfileId: string,
    actor: AuthenticatedUser,
    action: 'READ' | 'WRITE' = 'READ',
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
        purposeOfUse: 'TREATMENT',
      },
      actor,
    );
    return decision.decision === 'PERMIT';
  }

  /**
   * ¿Está este profesional atendiendo a esta persona?
   *
   * Tres caminos, y el orden importa porque el barato va primero:
   *
   * 1. **Hay una consulta en curso.** Sin mirar el calendario. Que el
   *    profesional haya apretado «Iniciar consulta» es la afirmación más fuerte
   *    que el sistema tiene de que está atendiendo a esa persona **ahora**; la
   *    fecha del cupo sólo dice cuándo se pensaba que iba a atenderla.
   * 2. **Hay una reserva viva que cae hoy**, que es la regla de siempre.
   * 3. **Hay una relación asistencial vigente** (`authz.care_relationships`,
   *    ACTIVA y dentro de su ventana `valid_from`/`valid_to`) — el paciente
   *    asignado al profesional aunque hoy no tenga cupo agendado con él
   *    (ALV-029). Es la misma base de acceso que ya evalúa el PDP
   *    (`AuthzPdpService`) para el resto del sistema; acá se reusa el mismo
   *    criterio, no uno nuevo.
   *
   * ## Por qué se agregó el primero
   *
   * Porque las dos reglas del producto se contradecían, y se midió en un
   * recorrido real. La agenda deja **empezar una cita confirmada cuando el
   * profesional decide, no cuando el reloj lo permite** —corrección #15, pedido
   * explícito del propietario, con casos reales detrás: la teleconsulta, el
   * consultorio de una sola persona, el paciente que llegó antes—. Y el
   * expediente exigía que el cupo fuera de hoy. El resultado era que se podía
   * iniciar la consulta y no leer la historia de quien estaba enfrente.
   *
   * ## Qué ensancha, dicho sin adornos
   *
   * Un profesional con una cita **de otro día** puede iniciarla y leer el
   * expediente ese día. Se aceptó con tres razones: la cita con ese paciente
   * sigue siendo el filtro —nadie llega a alguien con quien no tiene turno—;
   * iniciar **deja rastro firmado** en el historial de la reserva, con quién y
   * cuándo, cosa que una lectura no deja; y ya había una puerta igual de ancha
   * en el otro eje, porque una cita `COMPLETED` de hace meses habilita el
   * expediente el día en que ocurrió.
   *
   * La alternativa era la contraria —prohibir iniciar una cita que no sea de
   * hoy—, y se descartó porque deshacía la corrección #15.
   */
  private async estaAtendiendo(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
  ): Promise<boolean> {
    if (
      await this.bookingsRepo.tieneConsultaEnCurso(
        em,
        practitionerProfileId,
        patientProfileId,
        SCHED.BOOKING_IN_PROGRESS,
      )
    ) {
      return true;
    }
    if (await this.atiendeHoy(em, practitionerProfileId, patientProfileId)) {
      return true;
    }
    return this.tieneRelacionAsistencialVigente(
      em,
      practitionerProfileId,
      patientProfileId,
    );
  }

  /**
   * ¿Hay una relación asistencial ACTIVA, vigente y SIN acotar a un propósito
   * distinto, entre ambos? (ALV-029)
   *
   * `findActiveForPractitionerPatient` sólo filtra por `status_concept_id`: la
   * ventana temporal (`valid_from`/`valid_to`) se comprueba acá, con el mismo
   * criterio que ya usa `AuthzPdpService.isWithinWindow` — reusar la tabla sin
   * reusar la ventana habilitaría una relación ya vencida.
   *
   * ## Por qué se descarta una relación con `purposeConceptId`
   *
   * El PDP (`AuthzPdpService`, caso 6c) exige que una relación acotada a un
   * propósito sólo habilite acciones que declaren ESE mismo propósito. Este
   * endpoint no recibe ningún propósito de uso —es el resumen clínico
   * completo, no una acción puntual—, así que no hay con qué comparar. Tratar
   * una relación acotada como si abriera el resumen entero sería darle más
   * alcance del que su propio propósito le fija: fail-closed, igual que el PDP.
   *
   * @param em - Contexto de persistencia.
   * @param practitionerProfileId - El profesional que pide.
   * @param patientProfileId - El paciente cuya historia se pide.
   * @returns `true` si hay una relación activa, sin propósito acotado, cuya
   *          ventana cubre este instante.
   */
  private async tieneRelacionAsistencialVigente(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
  ): Promise<boolean> {
    const ahora = Date.now();
    const relaciones =
      await this.careRelationshipsRepo.findActiveForPractitionerPatient(
        em,
        practitionerProfileId,
        patientProfileId,
      );
    return relaciones.some((relacion) => {
      if (relacion.purposeConceptId) return false;
      if (relacion.validFrom.getTime() > ahora) return false;
      if (relacion.validTo && relacion.validTo.getTime() <= ahora) {
        return false;
      }
      return true;
    });
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
  private async atiendeHoy(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
  ): Promise<boolean> {
    const ahora = new Date();
    const reservas = await this.bookingsRepo.findConfirmadasConPacienteEntre(
      em,
      practitionerProfileId,
      patientProfileId,
      new Date(ahora.getTime() - VENTANA_MS),
      new Date(ahora.getTime() + VENTANA_MS),
      ESTADOS_QUE_HABILITAN,
    );

    return reservas.some((reserva) => {
      const zona = reserva.timeZone ?? ZONA_POR_DEFECTO;
      const hoy = diaLocalDe(ahora, zona);
      const dia = diaLocalDe(reserva.startAt, zona);
      return (
        dia.year === hoy.year && dia.month === hoy.month && dia.day === hoy.day
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
    linkResuelto?: Awaited<
      ReturnType<PersonAccountLinksRepository['findActiveByUser']>
    >,
  ): Promise<void> {
    const em = this.em.fork();
    // El vínculo puede venir ya resuelto del gate: la base no garantiza que sea
    // único (su índice vive comentado), así que resolverlo dos veces en la misma
    // petición podría devolver personas distintas.
    const link =
      linkResuelto !== undefined
        ? linkResuelto
        : await this.accountLinksRepo.findActiveByUser(em, actor.id);
    const perfil = await this.patientProfilesRepo.findById(
      em,
      patientProfileId,
    );

    if (!link || !perfil || perfil.profileId !== link.personId) {
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
      throw new ForbiddenException(SIN_ACCESO_A_LA_HISTORIA);
    }
  }

  /**
   * UC-39-20: historial clínico del paciente.
   *
   * N-04 (BR-13): la lectura **deja rastro** en `audit.data_access_log` —quién,
   * qué paciente, con qué propósito—, en el mismo `EntityManager` de la
   * lectura y **antes** de devolver nada: si el asiento no se puede escribir,
   * el resumen no se sirve (fail-closed, mismo criterio que el break-the-glass
   * de `authz`). El asiento lleva identificadores, nunca contenido clínico.
   *
   * @param patientProfileId - Paciente cuyo historial se lee.
   * @param limit - Tope por bloque.
   * @param actor - Quién lee; ya autorizado por `ClinicalRecordAccessGuard`.
   * @returns Condiciones, alergias, medicación, observaciones, encuentros y
   *          episodios de cuidado.
   */
  async getPatientSummary(
    patientProfileId: string,
    limit: number,
    actor: AuthenticatedUser,
  ): Promise<PatientClinicalSummaryResponseDto> {
    this.logger.info(
      { operation: 'clinical.patient.read', patientProfileId, limit },
      'Leyendo historial clínico del paciente',
    );

    const em = this.em.fork();
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

    const truncated: string[] = [];
    const cutConditions = this.cut(conditions, limit, 'conditions', truncated);
    const cutAllergies = this.cut(allergies, limit, 'allergies', truncated);

    // BR-14 (CL-10): última revisión de cada condición, en lote, para leer el
    // motivo del último cambio de estado desde `data_snapshot` (decisión
    // D-BR14-04, sin columna nueva).
    const conditionHistory = await this.historyRepo.latestBySource(
      em,
      'conditions',
      cutConditions.map((c) => c.id),
    );
    // BR-14 (CL-11): reacciones de cada alergia, en lote.
    const reactionsByAllergy = new Map<
      string,
      {
        id: string;
        manifestationConceptId: string;
        severityConceptId?: string;
        description?: string;
      }[]
    >();
    const reactions = await this.allergyReactionsRepo.findByAllergyIds(
      em,
      cutAllergies.map((a) => a.id),
    );
    for (const reaction of reactions) {
      const list = reactionsByAllergy.get(reaction.allergyId) ?? [];
      list.push({
        id: reaction.id,
        manifestationConceptId: reaction.manifestationConceptId,
        severityConceptId: reaction.severityConceptId,
        description: reaction.description,
      });
      reactionsByAllergy.set(reaction.allergyId, list);
    }

    return {
      patientProfileId,
      conditions: cutConditions.map((row) => {
        const snapshot = conditionHistory.get(row.id)?.dataSnapshot as
          Record<string, unknown> | undefined;
        const lastStatusChangeReasonText =
          typeof snapshot?.statusChangeReasonText === 'string'
            ? snapshot.statusChangeReasonText
            : undefined;
        return {
          id: row.id,
          codeConceptId: row.codeConceptId,
          categoryConceptId: row.categoryConceptId,
          clinicalStatusConceptId: row.clinicalStatusConceptId,
          verificationStatusConceptId: row.verificationStatusConceptId,
          severityConceptId: row.severityConceptId,
          encounterId: row.encounterId,
          clinicalCourseConceptId: row.clinicalCourseConceptId,
          lateralityConceptId: row.lateralityConceptId,
          onsetAt: row.onsetAt,
          expectedResolutionAt: row.expectedResolutionAt,
          resolvedAt: row.resolvedAt,
          noteText: row.noteText,
          lastStatusChangeReasonText,
          createdAt: row.createdAt,
        };
      }),
      allergies: cutAllergies.map((row) => ({
        id: row.id,
        substanceConceptId: row.substanceConceptId,
        encounterId: row.encounterId,
        typeConceptId: row.typeConceptId,
        categoryConceptId: row.categoryConceptId,
        criticalityConceptId: row.criticalityConceptId,
        clinicalStatusConceptId: row.clinicalStatusConceptId,
        reactions: reactionsByAllergy.get(row.id) ?? [],
        createdAt: row.createdAt,
      })),
      medicationRequests: this.cut(
        medicationRequests,
        limit,
        'medicationRequests',
        truncated,
      ).map((row) => ({
        id: row.id,
        medicationConceptId: row.medicationConceptId,
        statusConceptId: row.statusConceptId,
        prescriberProfileId: row.prescriberProfileId,
        encounterId: row.encounterId,
        doseText: row.doseText,
        frequencyText: row.frequencyText,
        validFrom: row.validFrom,
        validTo: row.validTo,
        patientInstructionsText: row.patientInstructionsText,
        indicationConditionId: row.indicationConditionId,
        indicationText: row.indicationText,
        signedAt: row.signedAt,
        issuedAt: row.issuedAt,
        createdAt: row.createdAt,
      })),
      observations: this.cut(
        observations,
        limit,
        'observations',
        truncated,
      ).map((row) => ({
        id: row.id,
        codeConceptId: row.codeConceptId,
        statusConceptId: row.statusConceptId,
        interpretationConceptId: row.interpretationConceptId,
        valueDecimal: row.valueDecimal,
        valueText: row.valueText,
        valueBoolean: row.valueBoolean,
        valueConceptId: row.valueConceptId,
        quantityValue: row.quantityValue,
        quantityUnitConceptId: row.quantityUnitConceptId,
        effectiveStartAt: row.effectiveStartAt,
        encounterId: row.encounterId,
      })),
      encounters: this.cut(encounters, limit, 'encounters', truncated).map(
        (row) => ({
          id: row.id,
          episodeId: row.episodeId,
          statusConceptId: row.statusConceptId,
          classConceptId: row.classConceptId,
          primaryPractitionerId: row.primaryPractitionerId,
          reasonText: row.reasonText,
          startAt: row.startAt,
          endAt: row.endAt,
          rowVersion: row.rowVersion,
        }),
      ),
      careEpisodes: this.cut(
        careEpisodes,
        limit,
        'careEpisodes',
        truncated,
      ).map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        typeConceptId: row.typeConceptId,
        statusConceptId: row.statusConceptId,
        responsiblePractitionerId: row.responsiblePractitionerId,
        startAt: row.startAt,
        endAt: row.endAt,
        createdAt: row.createdAt,
      })),
      limit,
      truncated,
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
