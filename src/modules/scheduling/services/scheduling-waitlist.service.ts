import { Inject, Injectable } from '@nestjs/common';
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
import {
  WAITLIST_READ_PORT,
  WAITLIST_WRITE_PORT,
  type WaitlistReadPort,
  type WaitlistWritePort,
} from '../ports/waitlist.port';
import {
  CreateWaitlistEntryDto,
  WaitlistEntryResponseDto,
  ScheduleRemindersDto,
  ScheduleRemindersResponseDto,
  WorkerBatchResultDto,
  WaitlistCandidateSlotsResponseDto,
} from '../dto';

const DEFAULT_WORKER_BATCH = 100;
const DEFAULT_PRIORITY = 0;

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
    private readonly logger: PinoLogger,
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
    return this.session.transaction('promoteWaitlist', async (_em, transaction) => {
      const context = { transaction };
      const slot = await this.writer.findSlotCapacity(slotId, context);
      if (!slot) {
        throw new ResourceNotFoundException('Slot no encontrado', { slotId });
      }
      if (slot.remainingCapacity <= 0) {
        return {
          processed: 0,
          detail: 'El slot no tiene cupo libre para promover',
        };
      }

      const candidates = await this.writer.findActiveCandidates(
        slot.resourceId,
        CONCEPTS.WAITLIST_ACTIVE,
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
        detail: 'Candidatos notificados; la reserva la confirma el paciente',
      };
    });
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

    return this.session.transaction('scheduleReminders', async (_em, transaction) => {
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
        throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
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
    });
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
    return this.session.transaction('dispatchReminders', async (_em, transaction) => {
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
        detail:
          'Recordatorios marcados como enviados; la entrega la ejecuta messaging (35)',
      };
    });
  }
}
