import { randomUUID } from 'node:crypto';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../repositories';
import {
  HistoryRepository,
  type HistoryRevision,
} from '../../audit/repositories';
// Escritura cross-dominio acotada a la confirmación, como la lectura de
// `directory` que hace `iam` al emitir un token: al confirmar una reserva nace
// su cita clínica, porque son la misma cosa vista desde dos módulos. Ver
// `crearCitaClinica`.
import type { Appointments } from '../../clinical/entities';
import { AppointmentsRepository } from '../../clinical/repositories';
import { CLIN } from '../../clinical/clinical.concepts';
import type {
  AppointmentBookings,
  CancellationPolicySnapshot,
} from '../entities';
import { SCHED } from '../scheduling.concepts';
import { SchedulingNoticeRepository } from '../repositories/scheduling-notice.repository';
import {
  AGENDA_NOTICE_PORT,
  type AgendaNoticePort,
} from '../ports/agenda-notice.port';
import {
  avisoDeCambioDeCita,
  type CambioDeCita,
} from '../notices/agenda-notices';
import { isValidBookingTransition } from '../state/booking-state-machine';
import {
  requireReason,
  type BookingActorKind,
  type BookingTransitionSnapshot,
} from '../state/booking-transition';
import {
  CreateHoldDto,
  HoldResponseDto,
  ConfirmBookingDto,
  RequestBookingDto,
  AcceptBookingDto,
  RejectBookingDto,
  BookingDecisionResponseDto,
  BookingResponseDto,
  RescheduleBookingDto,
  RescheduleResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  WorkerBatchResultDto,
  BookingItemDto,
  BookingStatusReasonDto,
  BookingDelayNoticeDto,
  SearchBookingsResponseDto,
  type BookingChannel,
} from '../dto';

const CHANNEL_CONCEPT: Readonly<Record<BookingChannel, string>> = {
  PORTAL: CONCEPTS.CHANNEL_PORTAL,
  DESK: CONCEPTS.CHANNEL_DESK,
  PHONE: CONCEPTS.CHANNEL_PHONE,
};

/** Estados en los que una cita sigue ocupando cupo. */
const ACTIVE_BOOKING_STATES: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
];

/**
 * Estados que un listado muestra cuando no se piden las canceladas.
 *
 * **No es la misma lista que {@link ACTIVE_BOOKING_STATES}**, y confundirlas
 * tenía consecuencias visibles: «ocupa cupo» son dos estados, pero «hay que
 * mostrarla» son seis. Con la lista de cupo, una solicitud recién hecha no
 * aparecía en la cola del profesional —quedaba pedida y nadie la veía— y una
 * cita completada desaparecía del listado del paciente en cuanto se cerraba,
 * que es justo cuando la corrección #15 pide que la vea.
 *
 * Quedan fuera solo las dos terminales que el filtro nombra: cancelada y
 * ausencia.
 */
const VISIBLE_BOOKING_STATES: readonly string[] = [
  SCHED.BOOKING_REQUESTED,
  SCHED.BOOKING_PENDING_CONFIRMATION,
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
  SCHED.BOOKING_IN_PROGRESS,
  SCHED.BOOKING_COMPLETED,
];

/**
 * Roles que actúan del lado del prestador.
 *
 * Son los mismos que los endpoints de operación de cita declaran en sus
 * `@Roles`, más `SUPERADMIN`, que el `RolesGuard` trata como comodín. Se usan
 * para decidir a quién atribuir un cambio (`actorKind`), no para autorizar: eso
 * ya lo hizo el guard antes de llegar acá.
 */
const ROLES_DEL_PRESTADOR: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SCHEDULING_AGENT',
  'PRACTITIONER',
  'CLINICIAN',
  'SUPERADMIN',
];

/**
 * Roles que operan **cualquier** agenda, no solo la propia.
 *
 * Es el oficio de quien atiende el mostrador y de quien administra la agenda de
 * la organización: repartir turnos entre todos los consultorios. Un profesional
 * NO está acá a propósito — opera las citas de su recurso, y eso lo comprueba
 * `cargarParaOperar` contra el perfil de su token, no contra su rol.
 *
 * `SUPERADMIN` entra porque el `RolesGuard` lo trata como comodín: excluirlo
 * acá le negaría en el servicio lo que el guard ya le concedió.
 */
const ROLES_DE_AGENDA: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SCHEDULING_AGENT',
  'SUPERADMIN',
];

/**
 * Antelación de los recordatorios que se programan al aceptar (P8).
 *
 * Víspera y dos horas antes: la primera sirve para reorganizar el día, la
 * segunda para salir a tiempo. Son las dos que el registro del cliente nombra.
 */
const DEFAULT_REMINDER_OFFSETS: readonly number[] = [24 * 60, 2 * 60];

const DEFAULT_HOLD_TTL_SECONDS = 300;
const DEFAULT_WORKER_BATCH = 100;

/**
 * CAN-APT-001: ventana de cancelación por defecto (24h) cuando la reserva no tiene
 * snapshot (citas antiguas) o la política no definía una ventana específica.
 */
const DEFAULT_CANCELLATION_WINDOW_MINUTES = 24 * 60;

/**
 * Cómo nombra un recurso a la tabla de perfiles profesionales.
 *
 * **Son dos porque el sistema dice las dos cosas.** El DTO de agenda ejemplifica
 * `health_practitioner_profiles` —el nombre real de la tabla— y los recursos
 * sembrados traen `practitioner_profiles`. Aceptar sólo uno dejaría la cita
 * clínica sin profesional contra la mitad de los datos, y en silencio.
 *
 * El fallo es benigno: si ninguno coincide, la cita queda sin profesional, que
 * es lo correcto para una sala o un equipo.
 */
const TABLAS_DE_PERFIL_PROFESIONAL: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];

/**
 * Flujo de reserva: holds anti-double-booking, confirmación, reprogramación,
 * cancelación, check-in y el worker de expiración (UC-41-05 … 10).
 */
@Injectable()
export class SchedulingBookingsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param bookingsRepo - Valor de bookings repo requerido por la operación.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param historyRepo - Valor de history repo requerido por la operación.
   * @param appointmentsRepo - Citas clínicas que respaldan las reservas.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly appointmentsRepo: AppointmentsRepository,
    private readonly noticeRepo: SchedulingNoticeRepository,
    @Inject(AGENDA_NOTICE_PORT)
    private readonly notices: AgendaNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingBookingsService.name);
  }

  /**
   * UC-41-05: reserva temporalmente un cupo del slot.
   *
   * Este es el punto donde se evita el doble booking: el slot se toma con
   * `SELECT ... FOR UPDATE`, de modo que dos peticiones simultáneas se serializan y
   * el decremento de `remaining_capacity` nunca puede bajar de cero. El hold caduca
   * solo (TTL de la política) y el worker UC-41-07 devuelve el cupo.
   */
  async placeHold(
    slotId: string,
    dto: CreateHoldDto,
    actor: AuthenticatedUser,
  ): Promise<HoldResponseDto> {
    this.logger.info(
      { operation: 'scheduling.hold.place', slotId },
      'Placing hold on bookable slot',
    );

    return this.em.transactional(async (tx) => {
      const slot = await this.bookingsRepo.findSlotForUpdate(tx, slotId);
      if (!slot) {
        throw new ResourceNotFoundException('Slot no encontrado', { slotId });
      }
      if (slot.statusConceptId === CONCEPTS.SLOT_BLOCKED) {
        throw new PreconditionFailedException('El slot está bloqueado', {
          slotId,
        });
      }
      if (slot.remainingCapacity <= 0) {
        throw new ConflictException('El slot no tiene cupos disponibles', {
          slotId,
        });
      }

      const policy = slot.scheduleTemplateId
        ? await this.resolvePolicy(tx, slot.scheduleTemplateId)
        : null;

      // Un turno que ya empezó no se puede pedir, aunque le quede capacidad: la
      // agenda dejó de ofrecerlos (A-03) y acá se cierra la puerta directa
      // (A-02). Es 422 y no 404 a propósito —el cupo existe, lo que no existe
      // es la posibilidad— y el mensaje lo dice en palabras, porque lo lee un
      // paciente.
      const ahora = Date.now();
      const minutosDeAviso = policy?.minNoticeMinutes ?? 0;
      const yaPaso = slot.startAt.getTime() <= ahora;
      const demasiadoSobreLaHora =
        slot.startAt.getTime() <= ahora + minutosDeAviso * 60_000;

      if (yaPaso || demasiadoSobreLaHora) {
        // Dos motivos distintos merecen dos frases distintas: a quien pide un
        // turno de la semana pasada no se le habla de anticipación mínima, y a
        // quien llega diez minutos tarde para una regla de treinta no se le
        // dice que «ya pasó» cuando todavía no pasó.
        throw new PreconditionFailedException(
          yaPaso
            ? 'Ese horario ya pasó.'
            : `Ese turno empieza demasiado pronto: hay que pedirlo con al menos ${minutosDeAviso} minutos de anticipación.`,
          { slotId, startAt: slot.startAt.toISOString(), minutosDeAviso },
        );
      }

      if (policy?.maxActivePerPatient && dto.patientProfileId) {
        const active = await this.bookingsRepo.countActiveBookingsForPatient(
          tx,
          dto.patientProfileId,
          [...ACTIVE_BOOKING_STATES],
        );
        if (active >= policy.maxActivePerPatient) {
          throw new ConflictException(
            'El paciente alcanzó el máximo de citas activas',
            {
              patientProfileId: dto.patientProfileId,
              maxActivePerPatient: policy.maxActivePerPatient,
            },
          );
        }
      }

      const ttlSeconds = policy?.holdTtlSeconds ?? DEFAULT_HOLD_TTL_SECONDS;
      const holdToken = randomUUID();
      const hold = this.bookingsRepo.createHold(tx, {
        bookableSlotId: slotId,
        patientProfileId: dto.patientProfileId,
        heldByUserId: actor.id,
        holdToken,
        statusConceptId: CONCEPTS.HOLD_ACTIVE,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
        actorUserId: actor.id,
      });

      slot.remainingCapacity -= 1;
      if (slot.remainingCapacity === 0)
        slot.statusConceptId = CONCEPTS.SLOT_HELD;
      touch(slot, actor.id);

      return {
        id: hold.id,
        holdToken,
        expiresAt: hold.expiresAt.toISOString(),
        remainingCapacity: slot.remainingCapacity,
      };
    });
  }

  /**
   * UC-41-06: convierte el hold en cita confirmada.
   *
   * Un hold vencido no se puede confirmar aunque el worker todavía no lo haya
   * reciclado: la comprobación por `expires_at` es lo que evita que una petición
   * tardía se cuele sobre un cupo que ya se considera libre.
   *
   * Es la entrada del mostrador y de quien ya tiene potestad para comprometer la
   * agenda. El paciente que pide un turno entra por {@link requestBooking}: el
   * cupo se toma igual, pero la cita nace pendiente de que el profesional la
   * acepte.
   */
  async confirmBooking(
    holdToken: string,
    dto: ConfirmBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.confirm',
        patientProfileId: dto.patientProfileId,
      },
      'Confirming booking from hold',
    );

    return this.materializarReserva(
      holdToken,
      {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        channel: dto.channel,
        reasonText: dto.reasonText,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
        appointmentStatusConceptId: CLIN.APPOINTMENT_BOOKED,
        confirmedAt: new Date(),
        reminderOffsetsMinutes: dto.reminderOffsetsMinutes ?? [],
      },
      actor,
    );
  }

  /**
   * El paciente **solicita** un turno: la cita nace pendiente de aceptación
   * (corrección #11, primer eslabón del P0).
   *
   * ## Qué cambia respecto de confirmar
   *
   * El cupo se toma igual —el hold ya lo descontó, y soltarlo mientras el
   * profesional decide dejaría que otra persona lo tomara y que la solicitud no
   * se pudiera aceptar nunca— pero la cita queda en `PENDING_CONFIRMATION`, sin
   * `confirmed_at` y con su cita clínica en `pending`. La confirmación es del
   * profesional (carril 07), no de quien pide.
   *
   * ## Por qué no se programan recordatorios
   *
   * Recordar un turno que todavía puede rechazarse es prometer algo que nadie
   * comprometió. Se programan al aceptar.
   */
  async requestBooking(
    holdToken: string,
    dto: RequestBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.request',
        patientProfileId: dto.patientProfileId,
      },
      'Requesting booking from hold',
    );

    return this.materializarReserva(
      holdToken,
      {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        channel: dto.channel,
        reasonText: dto.reasonText,
        statusConceptId: SCHED.BOOKING_PENDING_CONFIRMATION,
        appointmentStatusConceptId: CLIN.APPOINTMENT_PENDING,
        reminderOffsetsMinutes: [],
      },
      actor,
    );
  }

  /**
   * Convierte una retención viva en cita, en el estado que le corresponda.
   *
   * Es el cuerpo común de {@link confirmBooking} y {@link requestBooking}: las
   * dos consumen el mismo hold, congelan la misma política, crean la misma cita
   * clínica y liberan el mismo cupo si algo falla. Lo único que las distingue es
   * el estado con el que la cita nace y si ya hay compromiso (`confirmedAt`).
   */
  private async materializarReserva(
    holdToken: string,
    plan: {
      /** Organización dueña de la cita. */
      tenantId: string;
      /** Paciente titular. */
      patientProfileId: string;
      /** Canal por el que entró. */
      channel: BookingChannel;
      /** Motivo de consulta, si se declaró. */
      reasonText?: string;
      /** Estado con el que nace la reserva. */
      statusConceptId: string;
      /** Estado con el que nace la cita clínica que la respalda. */
      appointmentStatusConceptId: string;
      /** Instante del compromiso; ausente mientras nadie la aceptó. */
      confirmedAt?: Date;
      /** Recordatorios a programar junto con la cita. */
      reminderOffsetsMinutes: readonly number[];
    },
    actor: AuthenticatedUser,
  ): Promise<BookingResponseDto> {
    return this.em.transactional(async (tx) => {
      const hold = await this.bookingsRepo.findHoldByTokenForUpdate(
        tx,
        holdToken,
      );
      if (!hold) {
        throw new ResourceNotFoundException(
          'Reserva temporal no encontrada',
          {},
        );
      }
      if (hold.statusConceptId !== CONCEPTS.HOLD_ACTIVE) {
        throw new ConflictException(
          'La reserva temporal ya fue consumida o liberada',
          {
            holdId: hold.id,
          },
        );
      }
      if (hold.expiresAt.getTime() <= Date.now()) {
        throw new ConflictException('La reserva temporal expiró', {
          holdId: hold.id,
        });
      }

      const slot = await this.bookingsRepo.findSlotForUpdate(
        tx,
        hold.bookableSlotId,
      );
      if (!slot) {
        throw new ResourceNotFoundException('Slot no encontrado', {
          slotId: hold.bookableSlotId,
        });
      }
      // Segundo cinturón de A-02: el hold ya no se puede tomar sobre un turno
      // vencido, pero uno tomado hace rato puede llegar acá con el horario
      // recién pasado. Cubre a la vez confirmar y solicitar, que es por lo que
      // vive acá y no en cada una.
      if (slot.startAt.getTime() <= Date.now()) {
        throw new PreconditionFailedException('Ese horario ya pasó.', {
          slotId: slot.id,
          startAt: slot.startAt.toISOString(),
        });
      }

      // CAN-APT-001: se congela la política de cancelación vigente en el momento
      // de tomar el cupo. La referencia `booking_policy_id` puede mutar de
      // versión después, pero el snapshot preserva las condiciones que el
      // paciente aceptó.
      const policy = slot.scheduleTemplateId
        ? await this.resolvePolicy(tx, slot.scheduleTemplateId)
        : null;
      // CAN-TIME-001: la tz vive en el recurso; se congela para auditoría aunque el
      // plazo se evalúe sobre instantes UTC (`start_at` es timestamptz).
      const resource = slot.resourceId
        ? await this.catalogRepo.findResourceById(tx, slot.resourceId)
        : null;
      const cancellationPolicySnapshot: CancellationPolicySnapshot = {
        policyId: policy?.id,
        policyRowVersion: policy?.rowVersion,
        cancellationWindowMinutes:
          policy?.cancellationWindowMinutes ??
          DEFAULT_CANCELLATION_WINDOW_MINUTES,
        noShowFeeAmount: policy?.noShowFeeAmount ?? undefined,
        currencyConceptId: policy?.currencyConceptId ?? undefined,
        timeZone: resource?.timeZone ?? undefined,
        capturedAt: new Date().toISOString(),
      };

      // La cita clínica que respalda la reserva. Se crea **antes** para poder
      // enlazarla: `appointment_id` es una columna uuid suelta, así que el orden
      // lo garantiza esto y no la unidad de trabajo.
      const appointment = this.crearCitaClinica(tx, {
        tenantId: plan.tenantId,
        patientProfileId: plan.patientProfileId,
        resourceRefType: resource?.resourceRefType,
        resourceRefId: resource?.resourceRefId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        reasonText: plan.reasonText,
        statusConceptId: plan.appointmentStatusConceptId,
        actorUserId: actor.id,
      });
      // **Persistir la cita antes de crear la reserva.** `appointment_id` es una
      // columna uuid plana con clave foránea, no una relación gestionada: sin
      // este `flush` la cita vive sólo en el mapa de identidad y el INSERT de la
      // reserva viola `fk_appointment_bookings_appointment_id`. Lo destapó la
      // verificación contra la base real; ninguna prueba con dobles lo veía.
      await tx.flush();

      const booking = this.bookingsRepo.createBooking(tx, {
        tenantId: plan.tenantId,
        patientProfileId: plan.patientProfileId,
        appointmentId: appointment.id,
        bookableSlotId: hold.bookableSlotId,
        resourceId: slot.resourceId,
        serviceConceptId: slot.serviceConceptId,
        bookingChannelConceptId: CHANNEL_CONCEPT[plan.channel],
        bookedByUserId: actor.id,
        statusConceptId: plan.statusConceptId,
        confirmedAt: plan.confirmedAt,
        bookingPolicyId: policy?.id,
        cancellationPolicySnapshot,
        reasonText: plan.reasonText,
        actorUserId: actor.id,
      });
      // Mismo caso que la plantilla y sus franjas: `booking_id` es una columna
      // uuid suelta en `appointment_reminders`, así que persistir la cita antes
      // de crear los recordatorios es lo único que garantiza el orden. Sólo se
      // manifiesta cuando la confirmación pide recordatorios, que es el camino
      // normal desde el portal.
      await tx.flush();

      hold.statusConceptId = CONCEPTS.HOLD_CONSUMED;
      touch(hold, actor.id);

      if (slot.remainingCapacity === 0)
        slot.statusConceptId = CONCEPTS.SLOT_BOOKED;
      touch(slot, actor.id);

      // Los recordatorios se programan junto con la cita (UC-41-13 va incluido aquí).
      const offsets = plan.reminderOffsetsMinutes;
      for (const offset of offsets) {
        this.bookingsRepo.createReminder(tx, {
          bookingId: booking.id,
          channelConceptId: CONCEPTS.REMINDER_CH_SMS,
          offsetMinutes: offset,
          scheduledAt: new Date(slot.startAt.getTime() - offset * 60_000),
          statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
          actorUserId: actor.id,
        });
      }

      return {
        id: booking.id,
        bookableSlotId: hold.bookableSlotId,
        statusConceptId: plan.statusConceptId,
        remindersScheduled: offsets.length,
      };
    });
  }

  /**
   * UC-41-07 (worker): recicla los holds vencidos y devuelve el cupo.
   *
   * Idempotente y seguro entre workers: el lote se toma con `SKIP LOCKED`, así que
   * dos instancias se reparten el trabajo en vez de bloquearse mutuamente.
   */
  async expireHolds(
    limit = DEFAULT_WORKER_BATCH,
  ): Promise<WorkerBatchResultDto> {
    return this.em.transactional(async (tx) => {
      const expired = await this.bookingsRepo.findExpiredHolds(
        tx,
        CONCEPTS.HOLD_ACTIVE,
        new Date(),
        limit,
      );

      for (const hold of expired) {
        hold.statusConceptId = CONCEPTS.HOLD_EXPIRED;
        hold.releasedAt = new Date();
        touch(hold, undefined);

        const slot = await this.bookingsRepo.findSlotForUpdate(
          tx,
          hold.bookableSlotId,
        );
        if (!slot) continue;
        slot.remainingCapacity += 1;
        if (slot.statusConceptId === CONCEPTS.SLOT_HELD) {
          slot.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(slot, undefined);
      }

      if (expired.length > 0) {
        this.logger.info(
          { operation: 'scheduling.hold.expire', released: expired.length },
          'Released expired holds',
        );
      }

      return {
        processed: expired.length,
        detail: 'Holds vencidos liberados y cupo devuelto',
      };
    });
  }

  /**
   * UC-41-08: mueve la cita a otro slot, liberando el cupo del original.
   *
   * **Exige motivo** (corrección #14): mover un turno le cambia el día a
   * alguien. El motivo se valida en el servidor —no alcanza con que el
   * formulario lo pida— y queda en el historial de la cita, de donde lo lee la
   * otra parte.
   */
  async reschedule(
    bookingId: string,
    dto: RescheduleBookingDto,
    actor: AuthenticatedUser,
  ): Promise<RescheduleResponseDto> {
    const motivo = requireReason(dto.reasonText, 'reprogramar la cita');

    this.logger.info(
      {
        operation: 'scheduling.booking.reschedule',
        bookingId,
        toSlotId: dto.toSlotId,
      },
      'Rescheduling booking',
    );

    const resultado = await this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }
      if (!ACTIVE_BOOKING_STATES.includes(booking.statusConceptId)) {
        throw new PreconditionFailedException(
          'Solo se reprograma una cita vigente',
          {
            bookingId,
          },
        );
      }

      const fromSlotId = booking.bookableSlotId;
      if (fromSlotId === dto.toSlotId) {
        throw new PreconditionFailedException(
          'El slot destino es el mismo que el actual',
          {
            bookingId,
          },
        );
      }

      const target = await this.bookingsRepo.findSlotForUpdate(
        tx,
        dto.toSlotId,
      );
      if (!target) {
        throw new ResourceNotFoundException('Slot destino no encontrado', {
          slotId: dto.toSlotId,
        });
      }
      if (target.remainingCapacity <= 0) {
        throw new ConflictException('El slot destino no tiene cupos', {
          slotId: dto.toSlotId,
        });
      }

      const origin = await this.bookingsRepo.findSlotForUpdate(tx, fromSlotId);
      if (origin) {
        origin.remainingCapacity += 1;
        if (origin.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          origin.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(origin, actor.id);
      }

      target.remainingCapacity -= 1;
      if (target.remainingCapacity === 0)
        target.statusConceptId = CONCEPTS.SLOT_BOOKED;
      touch(target, actor.id);

      booking.bookableSlotId = dto.toSlotId;
      touch(booking, actor.id);

      this.bookingsRepo.recordReschedule(tx, {
        bookingId,
        fromSlotId,
        toSlotId: dto.toSlotId,
        rescheduledByUserId: actor.id,
        occurredAt: new Date(),
      });

      // El motivo va al historial y no a `booking_reschedules`: esa tabla solo
      // tiene `reason_concept_id` (de catálogo), y lo que la otra parte necesita
      // leer es el texto. Ver `state/booking-transition.ts`.
      await this.historyRepo.append(tx, 'appointment_bookings', bookingId, {
        operationConceptId: SCHED.HISTORY_OP_RESCHEDULE,
        dataSnapshot: {
          bookingId,
          fromSlotId,
          toSlotId: dto.toSlotId,
          reasonText: motivo,
          actorKind: this.actorKind(actor),
        } satisfies BookingTransitionSnapshot,
        changedByUserId: actor.id,
      });

      return { bookingId, fromSlotId, toSlotId: dto.toSlotId };
    });

    // Con el motivo (P8): el aviso dice el horario nuevo y por qué se movió.
    await this.avisarCambio(
      bookingId,
      'RESCHEDULED',
      motivo,
      this.actorKind(actor),
    );
    return resultado;
  }

  /**
   * UC-41-09: cancela la cita y libera el cupo.
   *
   * El cargo por inasistencia solo se aplica si la política lo define y la
   * cancelación se marca como no-show: cobrar por una cancelación avisada a tiempo
   * sería inconsistente con la ventana de cancelación de la política.
   *
   * **Exige motivo** (corrección #14). El `reason_concept_id` que ya se
   * persistía dice de qué clase es la cancelación —del paciente, del prestador,
   * inasistencia—, no por qué: eso queda en el historial y es lo que la otra
   * parte lee en el detalle de su cita.
   */
  async cancel(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    return this.cancelarYAvisar(bookingId, dto, actor, 'CANCELLED');
  }

  /**
   * El cuerpo compartido por cancelar y rechazar, con el aviso que corresponde
   * a cada uno (P8).
   *
   * Existe porque los dos hacen exactamente lo mismo con la cita —liberan el
   * cupo, registran la cancelación con su motivo— y lo único que cambia es qué
   * se le dice al otro lado: «tu turno se canceló» no es «no se pudo tomar tu
   * solicitud». Compartir el camino y separar el aviso es lo que evita que un
   * rechazo llegue con el texto de una cancelación.
   */
  private async cancelarYAvisar(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
    cambio: CambioDeCita,
  ): Promise<CancelBookingResponseDto> {
    const motivo = requireReason(dto.reasonText, 'cancelar la cita');

    this.logger.info(
      {
        operation: 'scheduling.booking.cancel',
        bookingId,
        isNoShow: dto.isNoShow === true,
      },
      'Cancelling booking',
    );

    const resultado = await this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }
      if (booking.statusConceptId === CONCEPTS.BOOKING_CANCELLED) {
        throw new ConflictException('La cita ya está cancelada', { bookingId });
      }

      // C-10: sólo se cancela desde un estado que la máquina permite cancelar
      // (no desde COMPLETED ni NO_SHOW).
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, CONCEPTS.BOOKING_CANCELLED);

      const isNoShow = dto.isNoShow ?? false;

      // CAN-APT-001: la ventana y el cargo salen del snapshot congelado de la
      // reserva, NUNCA de la política actual (que pudo cambiar tras la aceptación).
      // La columna es jsonb (`unknown` en la entidad generada); el contrato vive
      // en appointment_bookings.types.ts y quien escribió el snapshot lo honró.
      const snapshot = booking.cancellationPolicySnapshot as
        CancellationPolicySnapshot | undefined;
      const windowMinutes =
        snapshot?.cancellationWindowMinutes ??
        DEFAULT_CANCELLATION_WINDOW_MINUTES;

      // El cargo también se congela en el snapshot. Solo para reservas antiguas sin
      // snapshot se consulta la política actual como último recurso (compatibilidad).
      let feeSource = snapshot?.noShowFeeAmount;
      let currencyConceptId = snapshot?.currencyConceptId;
      if (feeSource === undefined && !snapshot && booking.bookingPolicyId) {
        const policy = await this.catalogRepo.findPolicyById(
          tx,
          booking.bookingPolicyId,
        );
        feeSource = policy?.noShowFeeAmount ?? undefined;
        currencyConceptId = policy?.currencyConceptId ?? undefined;
      }

      const slot = await this.bookingsRepo.findSlotForUpdate(
        tx,
        booking.bookableSlotId,
      );

      // CAN-TIME-001: el plazo se mide sobre instantes absolutos (`start_at` es
      // timestamptz en UTC), por lo que es independiente de la zona horaria; la tz
      // congelada del snapshot queda solo como dato de auditoría.
      const withinWindow =
        slot != null &&
        Date.now() >= slot.startAt.getTime() - windowMinutes * 60_000;

      // TJ-2 · el paciente no cancela fuera de plazo; quien atiende, sí.
      //
      // La ventana ya se calculaba, pero sólo decidía si se COBRABA: el
      // paciente podía cancelar cinco minutos antes y el sistema se limitaba a
      // facturarlo. Para el consultorio eso es un hueco que no se puede
      // rellenar, que es justamente lo que la ventana existe para evitar.
      //
      // Se comprueba contra el perfil del token y no contra `dto.cancelledBy`:
      // ese campo lo manda el cliente, y una regla que se apaga cambiando el
      // cuerpo de la petición no es una regla.
      //
      // Quien atiende cancela siempre —una urgencia no espera a la ventana— y
      // su cancelación dispara el aviso al paciente (P8).
      const esElPacienteTitular =
        actor.patientProfileId !== undefined &&
        actor.patientProfileId === booking.patientProfileId;

      if (esElPacienteTitular && withinWindow && !isNoShow) {
        throw new PreconditionFailedException(
          `Podés cancelar hasta ${Math.round(windowMinutes / 60)} horas antes del turno. Si ya no podés asistir, comunicate con el consultorio.`,
          {
            bookingId,
            cancellationWindowMinutes: windowMinutes,
            startAt: slot?.startAt.toISOString(),
          },
        );
      }

      // Se cobra si es inasistencia o si la cancelación cae dentro de la ventana
      // (tardía). Una cancelación avisada a tiempo no genera cargo.
      //
      // Tras la regla de arriba, la cancelación tardía sólo puede venir de quien
      // atiende o de una inasistencia: al paciente ya no se le cobra por algo
      // que no puede hacer.
      const chargeable = isNoShow || withinWindow;
      const feeAmount = chargeable ? (feeSource ?? undefined) : undefined;

      this.bookingsRepo.createCancellation(tx, {
        bookingId,
        reasonConceptId: isNoShow
          ? CONCEPTS.CANCEL_NO_SHOW
          : dto.cancelledBy === 'PATIENT'
            ? CONCEPTS.CANCEL_BY_PATIENT
            : CONCEPTS.CANCEL_BY_PROVIDER,
        cancelledByUserId: actor.id,
        isNoShow,
        feeAmount,
        currencyConceptId: feeAmount
          ? (currencyConceptId ?? CONCEPTS.CURRENCY_BOB)
          : undefined,
        cancelledAt: new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      booking.statusConceptId = CONCEPTS.BOOKING_CANCELLED;
      touch(booking, actor.id);
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: CONCEPTS.BOOKING_CANCELLED,
        reasonText: motivo,
        actorKind: dto.cancelledBy,
      });

      let capacityReleased = false;
      if (slot) {
        slot.remainingCapacity += 1;
        if (slot.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          slot.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(slot, actor.id);
        capacityReleased = true;
      }

      return { bookingId, feeAmount, capacityReleased };
    });

    await this.avisarCambio(bookingId, cambio, motivo, dto.cancelledBy);
    return resultado;
  }

  /**
   * El profesional **acepta** la solicitud: la cita queda confirmada
   * (corrección #11, segundo eslabón del P0).
   *
   * Es la contraparte de {@link requestBooking}. Recién acá hay compromiso, así
   * que recién acá se sella `confirmed_at`, la cita clínica pasa a `booked` y
   * se programan los recordatorios que la solicitud no programó.
   */
  async accept(
    bookingId: string,
    dto: AcceptBookingDto,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.accept', bookingId },
      'Accepting booking request',
    );

    const resultado = await this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, CONCEPTS.BOOKING_CONFIRMED);

      const confirmedAt = new Date();
      booking.statusConceptId = CONCEPTS.BOOKING_CONFIRMED;
      booking.confirmedAt = confirmedAt;
      touch(booking, actor.id);
      await this.sincronizarCitaClinica(
        tx,
        booking,
        CLIN.APPOINTMENT_BOOKED,
        actor,
      );
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: CONCEPTS.BOOKING_CONFIRMED,
        actorKind: 'PROVIDER',
      });

      // Los recordatorios se programan al aceptar y no al solicitar: recordar
      // un turno que todavía podía rechazarse sería prometer lo que nadie
      // comprometió.
      // P8: por omisión, víspera y dos horas antes. Aceptar sin recordatorios
      // dejaba el UC-41-13 dependiendo de que alguien los pidiera a mano, y el
      // registro del cliente pide el recordatorio como comportamiento, no como
      // opción. Un `[]` explícito sigue significando «ninguno».
      const offsets = dto.reminderOffsetsMinutes ?? DEFAULT_REMINDER_OFFSETS;
      const slot =
        offsets.length === 0
          ? null
          : await this.bookingsRepo.findSlotById(tx, booking.bookableSlotId);
      for (const offset of offsets) {
        if (!slot) break;
        this.bookingsRepo.createReminder(tx, {
          bookingId: booking.id,
          channelConceptId: CONCEPTS.REMINDER_CH_SMS,
          offsetMinutes: offset,
          scheduledAt: new Date(slot.startAt.getTime() - offset * 60_000),
          statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
          actorUserId: actor.id,
        });
      }

      return {
        bookingId: booking.id,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
        occurredAt: confirmedAt.toISOString(),
      };
    });

    // Fuera de la transacción a propósito (P8): un aviso que falla no puede
    // deshacer una cita que ya se confirmó. Ver `ports/agenda-notice.port.ts`.
    await this.avisarCambio(bookingId, 'ACCEPTED', undefined, 'PROVIDER');
    return resultado;
  }

  /**
   * El profesional **rechaza** la solicitud, con motivo (correcciones #11 y #14).
   *
   * Rechazar es cancelar desde el otro lado del mostrador, así que reusa el
   * mismo camino: libera el cupo, registra la cancelación con
   * `CANCEL_BY_PROVIDER` y deja el motivo en el historial, de donde el paciente
   * lo lee. Existe como acto propio porque en la agenda **es** otro acto —se
   * rechaza lo que todavía no se aceptó— y darle su nombre evita que la pantalla
   * tenga que explicar por qué «cancelar» aparece sobre una solicitud.
   */
  async reject(
    bookingId: string,
    dto: RejectBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.reject', bookingId },
      'Rejecting booking request',
    );

    return this.cancelarYAvisar(
      bookingId,
      { cancelledBy: 'PROVIDER', reasonText: dto.reasonText },
      actor,
      'REJECTED',
    );
  }

  /**
   * El profesional **inicia** la atención (corrección #15).
   *
   * **Sin validación de reloj, y es lo importante**: una cita confirmada se
   * puede empezar en cualquier momento. Las únicas comprobaciones son de estado
   * —solo se inicia una confirmada o con llegada registrada— y de actor —solo
   * quien atiende esa agenda—. Nunca de fecha.
   */
  async start(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.start', bookingId },
      'Starting appointment',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, SCHED.BOOKING_IN_PROGRESS);

      booking.statusConceptId = SCHED.BOOKING_IN_PROGRESS;
      touch(booking, actor.id);
      await this.sincronizarCitaClinica(
        tx,
        booking,
        CLIN.APPOINTMENT_CHECKED_IN,
        actor,
      );
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_IN_PROGRESS,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_IN_PROGRESS,
        occurredAt: new Date().toISOString(),
      };
    });
  }

  /**
   * El profesional **completa** la atención (corrección #15).
   *
   * Tampoco valida el reloj: se cierra la que está en curso, sin importar si
   * llegó o no el día agendado. El paciente ve «completada» apenas ocurre —el
   * listado por omisión incluye ese estado, ver {@link VISIBLE_BOOKING_STATES}—
   * sin re-seed ni refresco artificial.
   */
  async complete(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<BookingDecisionResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.complete', bookingId },
      'Completing appointment',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.cargarParaOperar(tx, bookingId, actor);
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, SCHED.BOOKING_COMPLETED);

      booking.statusConceptId = SCHED.BOOKING_COMPLETED;
      touch(booking, actor.id);
      await this.sincronizarCitaClinica(
        tx,
        booking,
        CLIN.APPOINTMENT_FULFILLED,
        actor,
      );
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: SCHED.BOOKING_COMPLETED,
        actorKind: 'PROVIDER',
      });

      return {
        bookingId: booking.id,
        statusConceptId: SCHED.BOOKING_COMPLETED,
        occurredAt: new Date().toISOString(),
      };
    });
  }

  /** UC-41-10: registra la llegada del paciente. */
  async checkIn(
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<CheckInResponseDto> {
    this.logger.info(
      { operation: 'scheduling.booking.check-in', bookingId },
      'Checking in',
    );

    return this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }
      // C-10: la máquina de estados sólo admite check-in desde CONFIRMED.
      const fromState = booking.statusConceptId;
      this.assertTransition(fromState, CONCEPTS.BOOKING_CHECKED_IN);

      const checkedInAt = new Date();
      booking.statusConceptId = CONCEPTS.BOOKING_CHECKED_IN;
      booking.checkedInAt = checkedInAt;
      touch(booking, actor.id);
      await this.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: fromState,
        toStateConceptId: CONCEPTS.BOOKING_CHECKED_IN,
      });

      return { bookingId, checkedInAt: checkedInAt.toISOString() };
    });
  }

  /**
   * Guarda de la máquina de estados de cita (C-10): rechaza cualquier transición
   * que la máquina no declara con `PreconditionFailedException`
   * (INVALID_STATE_TRANSITION). Es lo que impide, por ejemplo, hacer check-in de
   * una cita cancelada o completar una que nunca empezó.
   */
  private assertTransition(from: string, to: string): void {
    if (!isValidBookingTransition(from, to)) {
      throw new PreconditionFailedException(
        'Transición de estado de cita no permitida',
        {
          failureCode: 'INVALID_STATE_TRANSITION',
          fromStateConceptId: from,
          toStateConceptId: to,
        },
      );
    }
  }

  /**
   * Registra la transición en el historial existente
   * (`audit.appointment_bookings_history`). Se llama tras validar la transición y
   * aplicar el nuevo estado, con el estado de origen capturado antes de mutar.
   *
   * El snapshot va tipado (`BookingTransitionSnapshot`) porque desde la
   * corrección #14 no lleva solo los dos estados: lleva también el motivo y
   * desde qué lado se hizo el cambio, y la lectura los busca por nombre.
   */
  private async recordTransition(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
    snapshot: BookingTransitionSnapshot,
  ): Promise<void> {
    // C-10: versiona la transición vía el historial del módulo audit (contrato de
    // dominio), no escribiendo su tabla directamente (evita DIRECT_CROSS_DOMAIN).
    await this.historyRepo.append(tx, 'appointment_bookings', booking.id, {
      operationConceptId: SCHED.HISTORY_OP_STATE_TRANSITION,
      dataSnapshot: snapshot,
      changedByUserId: actor.id,
    });
  }

  /**
   * Carga la cita para operarla y comprueba **quién** puede hacerlo.
   *
   * ## Por qué el actor se valida acá y no solo en el `@Roles`
   *
   * El guard de roles responde «¿es un profesional?», no «¿es *el* profesional
   * de esta cita?». Sin esta comprobación, cualquier cuenta con rol clínico
   * podría aceptar, iniciar o cerrar el turno de un colega, que es exactamente
   * la clase de cosa que el rol solo no alcanza a impedir.
   *
   * Quien administra la agenda (`SCHEDULING_ADMIN`/`SCHEDULING_AGENT`) sí opera
   * cualquier cita: ese **es** su trabajo. Un profesional, solo las de su
   * recurso; y si su cuenta no declara perfil profesional, ninguna.
   *
   * @throws ResourceNotFoundException si la cita no existe.
   * @throws ForbiddenActionException si la cita no es de quien la opera.
   */
  private async cargarParaOperar(
    tx: EntityManager,
    bookingId: string,
    actor: AuthenticatedUser,
  ): Promise<AppointmentBookings> {
    const booking = await this.bookingsRepo.findBookingByIdForUpdate(
      tx,
      bookingId,
    );
    if (!booking) {
      throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
    }

    if (this.operaCualquierAgenda(actor)) {
      return booking;
    }

    const recurso = booking.resourceId
      ? await this.catalogRepo.findResourceById(tx, booking.resourceId)
      : null;
    const esSuAgenda =
      actor.practitionerProfileId !== undefined &&
      recurso !== null &&
      recurso.resourceRefId === actor.practitionerProfileId &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(recurso.resourceRefType);

    if (!esSuAgenda) {
      // Mismo mecanismo que usa `community` para «este perfil no es tuyo»: el
      // `ForbiddenException` de Nest, que el filtro traduce a 403 FORBIDDEN.
      throw new ForbiddenException(
        'Esta cita es de otra agenda: solo la opera quien atiende en ella.',
      );
    }
    return booking;
  }

  /**
   * Avisa del cambio de estado a quien no lo provocó (P8, tareas 4 y 5).
   *
   * ## A quién
   *
   * Al paciente, salvo cuando fue él quien canceló o reprogramó: en ese caso el
   * que necesita enterarse es el profesional. Avisarle al paciente de su propia
   * cancelación sería ruido, y no avisarle al profesional lo dejaría con un
   * hueco en la agenda que nadie le anunció.
   *
   * ## Por qué no lanza
   *
   * Porque se invoca **después** de que la transacción cerró y el estado ya es
   * el nuevo. Un fallo del canal se registra y se descarta: la regla del README
   * es que emitir jamás rompa una reserva. Ver `ports/agenda-notice.port.ts`.
   */
  private async avisarCambio(
    bookingId: string,
    cambio: CambioDeCita,
    motivo: string | undefined,
    actorKind: BookingActorKind,
  ): Promise<void> {
    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) return;

    const alProfesional = actorKind === 'PATIENT';
    const destinatario = alProfesional
      ? await this.noticeRepo.findResourceAccount(em, booking.resourceId)
      : null;

    if (alProfesional && destinatario === null) {
      // Un recurso que no es de un profesional —una sala, un equipo— no tiene a
      // quién avisarle. No es un fallo: es que no hay destinatario.
      this.logger.info(
        { operation: 'scheduling.notice.change', bookingId, cambio },
        'El recurso de la cita no tiene profesional al que avisar',
      );
      return;
    }

    await this.notices.emit(
      avisoDeCambioDeCita(
        booking,
        cambio,
        motivo,
        alProfesional
          ? { userId: destinatario as string }
          : { patientProfileId: booking.patientProfileId },
      ),
    );
  }

  /** Si el actor administra agendas ajenas por oficio. */
  private operaCualquierAgenda(actor: AuthenticatedUser): boolean {
    return actor.roles.some((rol) => ROLES_DE_AGENDA.includes(rol));
  }

  /**
   * Mantiene la cita clínica al día con el estado de la reserva.
   *
   * Son dos filas que cuentan lo mismo desde dos módulos, y desincronizarlas
   * tiene consecuencias visibles: el archivo del paciente (carril 09) lee
   * `clinical.appointments`, así que una cita atendida que allí siguiera
   * diciendo `booked` se leería como un turno al que nadie fue.
   *
   * Si la reserva no tiene cita clínica detrás no hace nada: pasa con las
   * reservas anteriores a que existiera ese vínculo, y no es un error.
   */
  private async sincronizarCitaClinica(
    tx: EntityManager,
    booking: AppointmentBookings,
    statusConceptId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (booking.appointmentId === undefined) {
      return;
    }
    const cita = await this.appointmentsRepo.findById(
      tx,
      booking.appointmentId,
    );
    if (!cita) {
      return;
    }
    cita.statusConceptId = statusConceptId;
    touch(cita, actor.id);
  }

  /**
   * Desde qué lado del mostrador actúa quien hace el cambio.
   *
   * Se decide por rol y no por la pantalla que llamó: un paciente que cancela su
   * propio turno tiene el rol `PATIENT` y nada más, mientras que quien atiende
   * —profesional, agente de agenda, administración— siempre trae alguno de los
   * roles del prestador. La duda se resuelve del lado del prestador: decirle al
   * paciente «lo cancelaste vos» cuando no fue así es peor que lo contrario.
   */
  private actorKind(actor: AuthenticatedUser): BookingActorKind {
    const esDelPrestador = actor.roles.some((rol) =>
      ROLES_DEL_PRESTADOR.includes(rol),
    );
    return esDelPrestador ? 'PROVIDER' : 'PATIENT';
  }

  /**
   * UC-41-15: listado de citas por paciente, recurso y/o ventana temporal.
   *
   * Es la lectura complementaria de la agenda: sin ella una pantalla podía
   * crear una cita pero no volver a encontrarla, y el paciente no tenía forma
   * de ver "mis próximas citas".
   *
   * Exige al menos un filtro a propósito: una consulta sin acotar devolvería
   * las citas de todos los pacientes de todos los tenants, que es justo lo que
   * un listado de PHI no debe hacer por descuido.
   *
   * @param filters - Paciente, recurso, ventana y si se incluyen las canceladas.
   * @param limit - Tope de filas.
   * @returns Citas que casan, con el instante resuelto desde su slot.
   * @throws PreconditionFailedException si no se acota o la ventana es inválida.
   */
  async searchBookings(
    filters: {
      /** Paciente titular. */
      patientProfileId?: string;
      /** Recurso (agenda). */
      resourceId?: string;
      /** Inicio de la ventana. */
      from?: Date;
      /** Fin de la ventana. */
      to?: Date;
      /** Incluir también las canceladas; por defecto no. */
      includeCancelled: boolean;
    },
    limit: number,
    actor?: AuthenticatedUser,
  ): Promise<SearchBookingsResponseDto> {
    if (!filters.patientProfileId && !filters.resourceId) {
      throw new PreconditionFailedException(
        'Indique al menos patientProfileId o resourceId para listar citas',
      );
    }
    if (filters.from && filters.to && !(filters.from < filters.to)) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        {
          from: filters.from.toISOString(),
          to: filters.to.toISOString(),
        },
      );
    }

    const em = this.em.fork();
    const { rows, fetchCapReached } = await this.bookingsRepo.findBookings(
      em,
      {
        patientProfileId: filters.patientProfileId,
        resourceId: filters.resourceId,
        from: filters.from,
        to: filters.to,
        // Sin esto una agenda mostraría como ocupados los huecos de citas que
        // ya se cancelaron.
        statusConceptIds: filters.includeCancelled
          ? undefined
          : [...VISIBLE_BOOKING_STATES],
      },
      limit + 1,
    );
    // Dos formas de quedarse corto, y las dos se declaran: sobrar filas para
    // esta página, o que la lectura previa al filtro por ventana agotara su
    // tope. La segunda no se ve en `rows.length` —el filtro pudo dejar menos de
    // `limit`— y callarla devolvería una agenda incompleta como si fuera toda.
    const truncated = rows.length > limit || fetchCapReached;
    const page = rows.length > limit ? rows.slice(0, limit) : rows;

    // Los motivos de la página, en **una** consulta (corrección #14): pedir el
    // historial cita por cita convertiría un listado de 100 en 101 consultas.
    const motivos = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      page.map(({ booking }) => booking.id),
      tieneMotivo,
    );
    // Segunda pasada sobre el mismo historial, con otro predicado: la demora
    // (P8) no es un motivo de cambio de estado y `latestBySource` devuelve una
    // revisión por agregado, así que pedir las dos cosas juntas dejaría fuera
    // la que llegó antes.
    const demoras = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      page.map(({ booking }) => booking.id),
      esDemora,
    );

    const origenes = await this.bookingsRepo.latestRescheduleOrigins(
      em,
      page.map(({ booking }) => booking.id),
    );

    // Los recursos de la página, en lote y sólo si el actor es un profesional:
    // es lo único que puede convertir «esta cita es de alguien» en «esta cita
    // es MÍA» para decidir el motivo. Un paciente no los necesita.
    const duenosDeAgenda = new Map<string, string>();
    if (actor?.practitionerProfileId !== undefined) {
      const ids = [
        ...new Set(
          page
            .map(({ booking }) => booking.resourceId)
            .filter((id): id is string => id !== undefined),
        ),
      ];
      for (const id of ids) {
        const recurso = await this.catalogRepo.findResourceById(em, id);
        if (recurso) duenosDeAgenda.set(id, recurso.resourceRefId);
      }
    }

    return {
      items: page.map(({ booking, slot }) =>
        this.aBookingItem(
          booking,
          slot,
          motivos.get(booking.id),
          demoras.get(booking.id),
          actor,
          booking.resourceId
            ? duenosDeAgenda.get(booking.resourceId)
            : undefined,
          origenes.get(booking.id),
        ),
      ),
      count: page.length,
      limit,
      truncated,
    };
  }

  /**
   * UC-41-15: una cita concreta.
   *
   * @param bookingId - Cita a leer.
   * @returns La cita con su instante resuelto desde el slot.
   * @throws ResourceNotFoundException si no existe.
   */
  async getBookingById(
    bookingId: string,
    actor?: AuthenticatedUser,
  ): Promise<BookingItemDto> {
    const em = this.em.fork();
    const booking = await this.bookingsRepo.findBookingById(em, bookingId);
    if (!booking) {
      throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
    }
    const slot = booking.bookableSlotId
      ? await this.bookingsRepo.findSlotById(em, booking.bookableSlotId)
      : null;
    const motivos = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      [booking.id],
      tieneMotivo,
    );
    const demoras = await this.historyRepo.latestBySource(
      em,
      'appointment_bookings',
      [booking.id],
      esDemora,
    );

    const origenes = await this.bookingsRepo.latestRescheduleOrigins(em, [
      booking.id,
    ]);

    // Sólo se busca el recurso si hace falta para decidir el motivo: un
    // paciente titular ya tiene permiso sin mirar la agenda.
    const recurso =
      booking.resourceId && actor?.practitionerProfileId !== undefined
        ? await this.catalogRepo.findResourceById(em, booking.resourceId)
        : null;

    return this.aBookingItem(
      booking,
      slot,
      motivos.get(booking.id),
      demoras.get(booking.id),
      actor,
      recurso?.resourceRefId,
      origenes.get(booking.id),
    );
  }

  /**
   * Una cita como la devuelven las dos lecturas.
   *
   * Está en un solo lugar porque el listado y el detalle tienen que decir
   * exactamente lo mismo: cuando el mapeo estaba duplicado, agregar un campo en
   * uno y olvidarlo en el otro hacía que el detalle contradijera a la fila que
   * lo abrió.
   */
  /**
   * ¿Puede este actor leer el **motivo de consulta** de esta cita?
   *
   * Sólo el paciente titular y el profesional que la atiende. Ni la
   * organización, ni otro médico, ni un administrador: por qué alguien pide un
   * turno es un dato clínico, y una agenda de organización que lo muestre
   * convierte un listado operativo en una lista de diagnósticos presuntos.
   *
   * **No** es lo mismo que el motivo de CANCELACIÓN (`statusReason`), que sí es
   * visible para las dos partes: ahí el interés es saber por qué se cayó el
   * turno, y quien lo escribió sabía que el otro lado lo iba a leer.
   *
   * Vive acá —en la proyección, un solo lugar— para que cualquier lectura
   * futura lo herede sin acordarse. Es lo que hace que la agenda de la
   * organización (TP-5) nazca sin la fuga.
   */
  private puedeVerElMotivo(
    booking: AppointmentBookings,
    actor?: AuthenticatedUser,
    profesionalDeLaAgenda?: string,
  ): boolean {
    if (!actor) return false;
    if (
      actor.patientProfileId !== undefined &&
      actor.patientProfileId === booking.patientProfileId
    ) {
      return true;
    }
    // El profesional que atiende. La cita no lo guarda: cuelga del recurso
    // (`resource_ref_id`), así que lo aporta quien proyecta — que es el único
    // que sabe si ya lo tenía cargado o no vale la pena buscarlo.
    return (
      actor.practitionerProfileId !== undefined &&
      profesionalDeLaAgenda !== undefined &&
      actor.practitionerProfileId === profesionalDeLaAgenda
    );
  }

  private aBookingItem(
    booking: AppointmentBookings,
    slot: { startAt: Date; endAt?: Date } | null,
    motivo: HistoryRevision | undefined,
    demora?: HistoryRevision,
    actor?: AuthenticatedUser,
    profesionalDeLaAgenda?: string,
    reprogramadaDesde?: Date,
  ): BookingItemDto {
    return {
      id: booking.id,
      patientProfileId: booking.patientProfileId,
      resourceId: booking.resourceId,
      bookableSlotId: booking.bookableSlotId,
      // El puente hacia `clinical`: es lo que el check-in de un encuentro
      // acepta como `appointmentId`. `?? null` y no la ausencia, porque el
      // contrato lo declara nullable y omitirlo obligaría a distinguir «no
      // hay cita» de «no me lo dijeron», que acá son lo mismo.
      appointmentId: booking.appointmentId ?? null,
      startAt: slot?.startAt ?? null,
      endAt: slot?.endAt ?? null,
      statusConceptId: booking.statusConceptId,
      serviceConceptId: booking.serviceConceptId,
      bookingChannelConceptId: booking.bookingChannelConceptId,
      confirmedAt: booking.confirmedAt,
      checkedInAt: booking.checkedInAt,
      // El motivo de consulta se omite salvo para el titular y su médico. Se
      // omite, no se vacía: un `''` diría «no escribió motivo», que es una
      // afirmación distinta y falsa.
      ...(this.puedeVerElMotivo(booking, actor, profesionalDeLaAgenda)
        ? { reasonText: booking.reasonText }
        : {}),
      ...(reprogramadaDesde ? { rescheduledFrom: reprogramadaDesde } : {}),
      statusReason: aStatusReason(motivo),
      delayNotice: aDelayNotice(demora),
      createdAt: booking.createdAt,
    };
  }

  /**
   * Crea la cita clínica que respalda una reserva confirmada.
   *
   * ## Por qué existe
   *
   * `clinical.appointments` era una tabla **que nadie escribía**: 0 filas, y
   * ninguna reserva con `appointment_id`. Eso dejaba rota una cadena entera —el
   * check-in de un encuentro declara `appointmentId` hacia esta tabla— así que
   * un encuentro nunca podía decir de qué turno venía. La columna existía, el
   * contrato la pedía, y no había forma de llenarla.
   *
   * ## Por qué al confirmar, y no en el check-in
   *
   * Porque una cita **es** el turno visto desde lo clínico, no el registro de
   * que alguien llegó — eso es el encuentro, que es otra tabla. Crearla en el
   * check-in la haría nacer *después* del encuentro que la referencia, que es el
   * vínculo al revés. El costo aceptado es que una reserva que nadie atienda
   * deja su cita en `APPT_BOOKED`, que es exactamente lo que pasó: un turno
   * agendado al que no se presentaron.
   *
   * ## El profesional sale del recurso, si el recurso es de uno
   *
   * Un recurso puede ser una sala o un equipo. Sólo se copia el profesional
   * cuando el recurso declara apuntar a un perfil profesional; si no, la cita
   * queda sin él en vez de con el uuid de una sala, que sería una clave foránea
   * rota y un dato falso.
   *
   * @param tx - Transacción de la confirmación; la cita nace o no nace con ella.
   * @param datos - Lo que la reserva sabe del turno.
   * @returns La cita creada, para enlazarla desde la reserva.
   */
  private crearCitaClinica(
    tx: EntityManager,
    datos: {
      tenantId: string;
      patientProfileId: string;
      resourceRefType?: string;
      resourceRefId?: string;
      startAt: Date;
      endAt?: Date;
      reasonText?: string;
      /** Estado clínico con el que nace: pendiente si se solicitó, reservada si se confirmó. */
      statusConceptId: string;
      actorUserId?: string;
    },
  ): Appointments {
    const esDeProfesional =
      datos.resourceRefType !== undefined &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(datos.resourceRefType);

    return this.appointmentsRepo.create(tx, {
      patientProfileId: datos.patientProfileId,
      tenantId: datos.tenantId,
      ...(esDeProfesional && datos.resourceRefId !== undefined
        ? { practitionerProfileId: datos.resourceRefId }
        : {}),
      statusConceptId: datos.statusConceptId,
      startAt: datos.startAt,
      ...(datos.endAt === undefined ? {} : { endAt: datos.endAt }),
      ...(datos.reasonText === undefined
        ? {}
        : { reasonText: datos.reasonText }),
      ...(datos.actorUserId === undefined
        ? {}
        : { actorUserId: datos.actorUserId }),
    });
  }

  /** Política efectiva del slot, heredada de su plantilla. */
  private async resolvePolicy(tx: EntityManager, templateId: string) {
    const template = await this.catalogRepo.findTemplateById(tx, templateId);
    if (!template?.bookingPolicyId) return null;
    return this.catalogRepo.findPolicyById(tx, template.bookingPolicyId);
  }
}

/**
 * El snapshot de una revisión, si tiene la forma que este módulo escribe.
 *
 * La columna es `jsonb` y llega como `unknown`: puede traer lo que haya escrito
 * cualquier versión anterior. Se comprueba en vez de castear, porque una cita de
 * antes de la corrección #14 tiene snapshot sin motivo y eso es normal, no un
 * error.
 */
function leerSnapshot(
  revision: HistoryRevision,
): BookingTransitionSnapshot | null {
  const snapshot: unknown = revision.dataSnapshot;
  if (typeof snapshot !== 'object' || snapshot === null) {
    return null;
  }
  return snapshot as BookingTransitionSnapshot;
}

/** Si la revisión explica el cambio: es la que se le muestra a la otra parte. */
function tieneMotivo(revision: HistoryRevision): boolean {
  const motivo = leerSnapshot(revision)?.reasonText;
  return typeof motivo === 'string' && motivo.trim().length > 0;
}

/**
 * Si la revisión es una demora informada (P8).
 *
 * Se reconoce por sus minutos y no por el concepto de operación porque el
 * predicado sólo ve el snapshot; los minutos son, además, lo único sin lo cual
 * la demora no se puede mostrar.
 */
function esDemora(revision: HistoryRevision): boolean {
  const minutos = leerSnapshot(revision)?.delayMinutes;
  return typeof minutos === 'number' && minutos > 0;
}

/**
 * La demora tal como sale por la API.
 *
 * `undefined` cuando no hay ninguna: quien la consuma tiene que poder preguntar
 * «¿se demora?» sin inspeccionar campos vacíos, igual que con el motivo.
 */
function aDelayNotice(
  revision: HistoryRevision | undefined,
): BookingDelayNoticeDto | undefined {
  if (!revision) return undefined;
  const snapshot = leerSnapshot(revision);
  const minutos = snapshot?.delayMinutes;
  if (typeof minutos !== 'number' || minutos <= 0) return undefined;

  const mensaje = snapshot?.reasonText;
  return {
    delayMinutes: minutos,
    ...(typeof mensaje === 'string' && mensaje.trim().length > 0
      ? { message: mensaje }
      : {}),
    announcedAt: revision.recordedAt,
  };
}

/**
 * El motivo tal como sale por la API.
 *
 * `undefined` —y no un objeto con campos vacíos— cuando no hay ninguno: quien
 * lo consuma tiene que poder preguntar «¿hay motivo?» sin inspeccionar el
 * contenido.
 */
function aStatusReason(
  revision: HistoryRevision | undefined,
): BookingStatusReasonDto | undefined {
  if (!revision) return undefined;
  const snapshot = leerSnapshot(revision);
  const motivo = snapshot?.reasonText;
  if (typeof motivo !== 'string' || motivo.trim().length === 0) {
    return undefined;
  }

  return {
    reasonText: motivo,
    ...(snapshot?.actorKind === undefined
      ? {}
      : { actorKind: snapshot.actorKind }),
    ...(snapshot?.toStateConceptId === undefined
      ? {}
      : { toStateConceptId: snapshot.toStateConceptId }),
    changedAt: revision.recordedAt,
  };
}
