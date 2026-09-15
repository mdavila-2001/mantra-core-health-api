import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  persistenceSessionToken,
  type PersistenceSession,
} from '../../../persistence';
import { SCHEDULING_MODULE } from '../scheduling.tokens';
import { SchedulingAgendaNoticesService } from './scheduling-agenda-notices.service';
import { PatientRepresentationService } from '../../profiles/services/patient-representation.service';
import {
  WAITLIST_READ_PORT,
  WAITLIST_WRITE_PORT,
  type WaitlistReadPort,
  type WaitlistWritePort,
} from '../ports/waitlist.port';
import {
  CreateWaitlistEntryDto,
  WaitlistEntryResponseDto,
  ListWaitlistQueryDto,
  ListResourceWaitlistQueryDto,
  ListWaitlistResponseDto,
  ScheduleRemindersDto,
  ScheduleRemindersResponseDto,
  WorkerBatchResultDto,
  WaitlistCandidateSlotsResponseDto,
} from '../dto';

const DEFAULT_WORKER_BATCH = 100;
const DEFAULT_PRIORITY = 0;

/** Tope por omisión de la lectura de la lista de espera de un paciente. */
const DEFAULT_LIST_LIMIT = 50;

/**
 * Roles que operan cualquier agenda, no sólo la propia.
 *
 * Los mismos tres que `SchedulingDelayService`: quien puede avisar la demora de
 * una agenda ajena puede ver quién la espera. Repetir la lista en vez de
 * compartirla es deliberado por ahora — son dos servicios y una constante de
 * cuatro líneas—, pero si aparece un tercero conviene subirla al módulo.
 */
const ROLES_DE_AGENDA: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SCHEDULING_AGENT',
  'SUPERADMIN',
];

/**
 * Lista de espera y recordatorios de cita (UC-41-11/12/13/14).
 *
 * Módulo piloto de la migración a puertos (§47, Fase 5). El servicio ya no
 * inyecta el `EntityManager` de MikroORM ni conoce ninguna entidad: declara qué
 * necesita del negocio a través de dos puertos y abre sus transacciones por la
 * sesión del módulo, que es quien decide la conexión.
 *
 * El comportamiento observable no cambia. Con `PERSISTENCE_PORTS_MODULES` sin
 * `scheduling`, la sesión es la directa y las consultas salen por el mismo
 * `EntityManager` de siempre; con el módulo activado, salen por el enrutado.
 */
@Injectable()
export class SchedulingWaitlistService {
  constructor(
    @Inject(persistenceSessionToken(SCHEDULING_MODULE))
    private readonly session: PersistenceSession,
    @Inject(WAITLIST_READ_PORT)
    private readonly reader: WaitlistReadPort,
    @Inject(WAITLIST_WRITE_PORT)
    private readonly writer: WaitlistWritePort,
    // P8: el servicio declara **a quién** avisar; con qué texto y a qué cuenta
    // lo resuelve el colaborador, que es quien puede leer entidades sin romper
    // la migración a puertos de este módulo.
    private readonly avisos: SchedulingAgendaNoticesService,
    private readonly logger: PinoLogger,
    // B.1 — quién puede actuar por un paciente. La regla vive en `profiles`;
    // acá sólo se consulta, igual que en el servicio de reservas.
    private readonly representation: PatientRepresentationService,
  ) {
    this.logger.setContext(SchedulingWaitlistService.name);
  }

  /** UC-41-11: inscribe al paciente en la lista de espera. */
  async enroll(
    dto: CreateWaitlistEntryDto,
    actor: AuthenticatedUser,
  ): Promise<WaitlistEntryResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.waitlist.enroll',
        patientProfileId: dto.patientProfileId,
      },
      'Enrolling patient in waitlist',
    );

    // Anotarse en la lista de espera de otro no tenía ninguna comprobación: con
    // el uuid de un perfil ajeno, cualquiera lo metía en la cola de una agenda y
    // le disparaba avisos. Va antes de abrir la transacción.
    await this.assertPuedeVerAlPaciente(dto.patientProfileId, actor);

    const priority = dto.priority ?? DEFAULT_PRIORITY;
    return this.session.transaction('enroll', async (_em, transaction) => {
      const { id } = await this.writer.enroll(
        {
          tenantId: dto.tenantId,
          patientProfileId: dto.patientProfileId,
          resourceId: dto.resourceId,
          desiredFrom: dto.desiredFrom ? new Date(dto.desiredFrom) : undefined,
          desiredTo: dto.desiredTo ? new Date(dto.desiredTo) : undefined,
          priority,
          statusConceptId: CONCEPTS.WAITLIST_ACTIVE,
          actorUserId: actor.id,
        },
        { transaction, actorUserId: actor.id },
      );

      return { id, priority, statusConceptId: CONCEPTS.WAITLIST_ACTIVE };
    });
  }

  /**
   * UC-41-11 (lectura): en qué listas de espera está un paciente (P8).
   *
   * Faltaba entera: se podía anotar a alguien y no había forma de decirle que
   * estaba anotado, así que la pantalla de turnos no podía mostrar «en espera»
   * sin inventárselo. Por omisión trae sólo las activas —las cubiertas y las
   * canceladas ya no son una espera— y con `includeClosed` las trae todas.
   *
   * @param query - Paciente, si incluir las cerradas y el tope de filas.
   * @returns Sus entradas, de la más reciente a la más antigua.
   */
  async listForPatient(
    query: ListWaitlistQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ListWaitlistResponseDto> {
    await this.assertPuedeVerAlPaciente(query.patientProfileId, actor);

    const estados =
      query.includeClosed === 'true' ? undefined : [CONCEPTS.WAITLIST_ACTIVE];

    const items = await this.reader.findEntriesForPatient(
      query.patientProfileId,
      estados,
      query.limit ?? DEFAULT_LIST_LIMIT,
    );

    return { items: items.map((item) => this.aItem(item)) };
  }

  /**
   * Quiénes esperan en una agenda — la vista de quien atiende (P8).
   *
   * ## Por qué es otro endpoint y no un filtro del anterior
   *
   * Porque son dos preguntas con dos sujetos y dos permisos. «¿En qué listas
   * estoy?» la hace el paciente sobre sí mismo; «¿quién espera mi agenda?» la
   * hace el profesional sobre su recurso. Meter las dos en una consulta con un
   * parámetro opcional habría dejado una bandera decidiendo **qué se
   * autoriza**, que es exactamente donde no debe vivir una bandera.
   *
   * ## Por qué el orden importa
   *
   * Es el mismo que usa la promoción: prioridad y después antigüedad. El médico
   * tiene que ver la lista en el orden en que se van a repartir los cupos, no
   * en el orden en que se anotaron.
   */
  async listForResource(
    resourceId: string,
    query: ListResourceWaitlistQueryDto,
    actor: AuthenticatedUser,
  ): Promise<ListWaitlistResponseDto> {
    await this.assertOperaLaAgenda(resourceId, actor);

    const estados =
      query.includeClosed === 'true' ? undefined : [CONCEPTS.WAITLIST_ACTIVE];

    const items = await this.reader.findEntriesForResource(
      resourceId,
      estados,
      query.limit ?? DEFAULT_LIST_LIMIT,
    );

    return { items: items.map((item) => this.aItem(item)) };
  }

  /**
   * Una entrada del puerto, tal como sale por la API.
   *
   * Los opcionales se **omiten** en vez de viajar como `undefined`: el contrato
   * distingue «no lo declaró» de «no me lo dijeron», y las dos lecturas de la
   * lista de espera comparten esta forma.
   */
  private aItem(
    item: Awaited<
      ReturnType<WaitlistReadPort['findEntriesForPatient']>
    >[number],
  ) {
    return {
      id: item.id,
      patientProfileId: item.patientProfileId,
      ...(item.resourceId === undefined ? {} : { resourceId: item.resourceId }),
      resourceLabel: item.resourceLabel,
      ...(item.desiredFrom === undefined
        ? {}
        : { desiredFrom: item.desiredFrom }),
      ...(item.desiredTo === undefined ? {} : { desiredTo: item.desiredTo }),
      priority: item.priority,
      statusConceptId: item.statusConceptId,
      createdAt: item.createdAt,
      ...(item.patientName === undefined
        ? {}
        : { patientName: item.patientName }),
    };
  }

  /**
   * Comprueba que quien pregunta puede ver la lista de espera de ese paciente.
   *
   * ## El agujero que cierra
   *
   * El endpoint recibía `patientProfileId` por query, admitía el rol `PATIENT`
   * y **no miraba de quién era el perfil**: cualquier paciente podía leer las
   * esperas de cualquier otro cambiando un uuid en la URL, y con ellas con qué
   * profesional espera y para qué fechas. Es un IDOR sobre dato de salud.
   *
   * El personal de agenda sigue viendo cualquiera —es su trabajo—; el resto,
   * sólo lo suyo. Un profesional que quiera saber quién espera **su** agenda no
   * pasa por acá: para eso está `listForResource`, que autoriza por el recurso.
   */
  private async assertPuedeVerAlPaciente(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.roles.some((rol) => ROLES_DE_AGENDA.includes(rol))) return;
    if (actor.patientProfileId === patientProfileId) return;
    // Quien lo representa (B.1): la madre que anota a su hijo en la cola tiene
    // que poder verla. Se pregunta al final y sólo si hizo falta, para no pagar
    // una consulta en el caso normal —el titular mirando lo suyo—.
    if (await this.representation.representsPatient(patientProfileId, actor)) {
      return;
    }

    throw new ForbiddenException(
      'Sólo el titular y el personal de agenda pueden ver esta lista de espera.',
    );
  }

  /**
   * Comprueba que quien pregunta atiende en esa agenda.
   *
   * Misma regla que la demora (`SchedulingDelayService.assertOperaLaAgenda`) y
   * por el mismo motivo: la lista de espera de una agenda dice quién quiere
   * turno con **ese** profesional, y eso lo ve quien atiende ahí.
   */
  private async assertOperaLaAgenda(
    resourceId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.roles.some((rol) => ROLES_DE_AGENDA.includes(rol))) return;

    const profesional = await this.reader.findResourcePractitioner(resourceId);
    if (
      profesional !== null &&
      actor.practitionerProfileId !== undefined &&
      profesional === actor.practitionerProfileId
    ) {
      return;
    }

    throw new ForbiddenException(
      'Esta agenda es de otro profesional: sólo ve quién la espera quien atiende en ella.',
    );
  }

  /**
   * UC-41-12 (worker): promueve candidatos de la lista de espera a un slot libre.
   *
   * La promoción **no reserva la cita**: marca al candidato como cubierto y deja
   * que el flujo normal de hold/confirmación se ejecute con su consentimiento.
   * Reservar automáticamente a nombre del paciente sería decidir por él.
   */
  async promoteWaitlist(
    slotId: string,
    limit = DEFAULT_WORKER_BATCH,
  ): Promise<WorkerBatchResultDto> {
    const promocion = await this.session.transaction(
      'promoteWaitlist',
      async (_em, transaction) => {
        const context = { transaction };
        const slot = await this.writer.findSlotCapacity(slotId, context);
        if (!slot) {
          throw new ResourceNotFoundException('Slot no encontrado', { slotId });
        }
        if (slot.remainingCapacity <= 0) {
          return { processed: 0, promotedIds: [] as string[] };
        }

        // La hora del cupo decide a quién le sirve: acotar sólo por recurso
        // avisaba a quien pedía otro mes y le consumía la entrada.
        const candidates = await this.writer.findActiveCandidates(
          slot.resourceId,
          CONCEPTS.WAITLIST_ACTIVE,
          slot.startAt,
          Math.min(limit, slot.remainingCapacity),
          context,
        );

        const promoted = await this.writer.markCandidatesFulfilled(
          candidates.map((candidate) => candidate.id),
          CONCEPTS.WAITLIST_FULFILLED,
          context,
        );

        if (promoted > 0) {
          this.logger.info(
            { operation: 'scheduling.waitlist.promote', slotId, promoted },
            'Promoted waitlist candidates',
          );
        }

        return {
          processed: promoted,
          // Los ids salen de la transacción para poder avisar fuera de ella: el
          // aviso no puede deshacer una promoción que ya se confirmó.
          promotedIds: promoted > 0 ? candidates.map((c) => c.id) : [],
        };
      },
    );

    // P8 · aviso (1): «se liberó un horario con …». Hasta acá la promoción
    // marcaba al candidato y no se lo decía a nadie — el cupo liberado existía
    // en la base y no en la app de quien lo estaba esperando.
    const avisados = await this.avisos.avisarCupoLiberado(
      slotId,
      promocion.promotedIds,
    );

    return {
      processed: promocion.processed,
      detail:
        promocion.processed === 0
          ? 'El slot no tenía candidatos que promover'
          : `Candidatos promovidos y avisados (${avisados} de ${promocion.processed}); la reserva la confirma el paciente`,
    };
  }

  /**
   * UC-41-12 (descubrimiento del worker): slots con cupo libre cuyo recurso
   * tiene candidatos activos en la lista de espera. `promoteWaitlist` exige un
   * `slotId` puntual y no devuelve ids, así que el worker necesita esta
   * consulta para saber qué slot promover en cada tick.
   *
   * Es la única operación del servicio que sale por la ruta de **lectura**: no
   * abre transacción y tolera consistencia eventual, así que es la primera
   * candidata a servirse desde una réplica el día que exista.
   */
  async findSlotsWithCandidates(
    limit = DEFAULT_WORKER_BATCH,
  ): Promise<WaitlistCandidateSlotsResponseDto> {
    const slotIds = await this.reader.findSlotsWithActiveCandidates(
      CONCEPTS.WAITLIST_ACTIVE,
      limit,
      new Date(),
    );
    return { slotIds };
  }

  /** UC-41-13: programa recordatorios adicionales para una cita. */
  async scheduleReminders(
    bookingId: string,
    dto: ScheduleRemindersDto,
    actor: AuthenticatedUser,
  ): Promise<ScheduleRemindersResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.reminder.schedule',
        bookingId,
        count: dto.offsetsMinutes.length,
      },
      'Scheduling appointment reminders',
    );

    return this.session.transaction(
      'scheduleReminders',
      async (_em, transaction) => {
        const context = { transaction, actorUserId: actor.id };
        const schedule = await this.writer.findBookingScheduleForUpdate(
          bookingId,
          context,
        );
        if (!schedule) {
          // El puerto devuelve `null` tanto si la cita no existe como si su slot
          // no existe. Se conserva el mensaje de la cita porque es el caso que un
          // cliente puede provocar; un slot ausente es una inconsistencia interna
          // que no debe describirse en una respuesta de la API.
          throw new ResourceNotFoundException('Cita no encontrada', {
            bookingId,
          });
        }

        const channelConceptId =
          dto.channel === 'EMAIL'
            ? CONCEPTS.REMINDER_CH_EMAIL
            : CONCEPTS.REMINDER_CH_SMS;

        const scheduled = await this.writer.scheduleReminders(
          {
            bookingId,
            channelConceptId,
            offsetsMinutes: dto.offsetsMinutes,
            slotStartAt: schedule.slotStartAt,
            statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
            actorUserId: actor.id,
          },
          context,
        );

        return { bookingId, scheduled };
      },
    );
  }

  /**
   * UC-41-14 (worker): marca como enviados los recordatorios cuya hora llegó.
   *
   * El envío real es responsabilidad del módulo de mensajería (35): aquí solo se
   * mueve el estado, sin simular un envío que no ocurrió.
   */
  async dispatchReminders(
    limit = DEFAULT_WORKER_BATCH,
  ): Promise<WorkerBatchResultDto> {
    const despacho = await this.session.transaction(
      'dispatchReminders',
      async (_em, transaction) => {
        const context = { transaction };
        const due = await this.writer.findDueReminders(
          CONCEPTS.REMINDER_SCHEDULED,
          new Date(),
          limit,
          context,
        );

        const dispatched = await this.writer.markRemindersSent(
          due.map((reminder) => reminder.id),
          CONCEPTS.REMINDER_SENT,
          new Date(),
          context,
        );

        if (dispatched > 0) {
          this.logger.info(
            { operation: 'scheduling.reminder.dispatch', dispatched },
            'Marked reminders as dispatched',
          );
        }

        return {
          processed: dispatched,
          dispatchedIds: due.map((reminder) => reminder.id),
        };
      },
    );

    // P8 · aviso (3): la entrega in-app. El comentario anterior decía «la
    // entrega la ejecuta messaging (35)», y era cierto salvo que nadie la
    // pedía: el recordatorio se marcaba enviado y no salía por ningún canal.
    const avisados = await this.avisos.avisarRecordatorios(
      despacho.dispatchedIds,
    );

    return {
      processed: despacho.processed,
      detail:
        despacho.processed === 0
          ? 'No había recordatorios vencidos'
          : `Recordatorios despachados y entregados por el canal in-app (${avisados} de ${despacho.processed})`,
    };
  }
}
