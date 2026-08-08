import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
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
import { HistoryRepository } from '../../audit/repositories';
import type {
  AppointmentBookings,
  CancellationPolicySnapshot,
} from '../entities';
import { SCHED } from '../scheduling.concepts';
import { isValidBookingTransition } from '../state/booking-state-machine';
import {
  CreateHoldDto,
  HoldResponseDto,
  ConfirmBookingDto,
  BookingResponseDto,
  RescheduleBookingDto,
  RescheduleResponseDto,
  CancelBookingDto,
  CancelBookingResponseDto,
  CheckInResponseDto,
  WorkerBatchResultDto,
  BookingItemDto,
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

const DEFAULT_HOLD_TTL_SECONDS = 300;
const DEFAULT_WORKER_BATCH = 100;

/**
 * CAN-APT-001: ventana de cancelación por defecto (24h) cuando la reserva no tiene
 * snapshot (citas antiguas) o la política no definía una ventana específica.
 */
const DEFAULT_CANCELLATION_WINDOW_MINUTES = 24 * 60;

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
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly historyRepo: HistoryRepository,
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

      // CAN-APT-001: se congela la política de cancelación vigente en el momento de
      // confirmar. La referencia `booking_policy_id` puede mutar de versión después,
      // pero el snapshot preserva las condiciones que el paciente aceptó.
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

      const booking = this.bookingsRepo.createBooking(tx, {
        tenantId: dto.tenantId,
        patientProfileId: dto.patientProfileId,
        bookableSlotId: hold.bookableSlotId,
        resourceId: slot.resourceId,
        serviceConceptId: slot.serviceConceptId,
        bookingChannelConceptId: CHANNEL_CONCEPT[dto.channel],
        bookedByUserId: actor.id,
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
        confirmedAt: new Date(),
        bookingPolicyId: policy?.id,
        cancellationPolicySnapshot,
        reasonText: dto.reasonText,
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
      const offsets = dto.reminderOffsetsMinutes ?? [];
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
        statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
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

  /** UC-41-08: mueve la cita a otro slot, liberando el cupo del original. */
  async reschedule(
    bookingId: string,
    dto: RescheduleBookingDto,
    actor: AuthenticatedUser,
  ): Promise<RescheduleResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.reschedule',
        bookingId,
        toSlotId: dto.toSlotId,
      },
      'Rescheduling booking',
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

      return { bookingId, fromSlotId, toSlotId: dto.toSlotId };
    });
  }

  /**
   * UC-41-09: cancela la cita y libera el cupo.
   *
   * El cargo por inasistencia solo se aplica si la política lo define y la
   * cancelación se marca como no-show: cobrar por una cancelación avisada a tiempo
   * sería inconsistente con la ventana de cancelación de la política.
   */
  async cancel(
    bookingId: string,
    dto: CancelBookingDto,
    actor: AuthenticatedUser,
  ): Promise<CancelBookingResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.booking.cancel',
        bookingId,
        isNoShow: dto.isNoShow === true,
      },
      'Cancelling booking',
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

      // Se cobra si es inasistencia o si la cancelación cae dentro de la ventana
      // (tardía). Una cancelación avisada a tiempo no genera cargo.
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
      await this.recordTransition(
        tx,
        booking,
        fromState,
        CONCEPTS.BOOKING_CANCELLED,
        actor,
      );

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
      await this.recordTransition(
        tx,
        booking,
        fromState,
        CONCEPTS.BOOKING_CHECKED_IN,
        actor,
      );

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
   */
  private async recordTransition(
    tx: EntityManager,
    booking: AppointmentBookings,
    fromStateConceptId: string,
    toStateConceptId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    // C-10: versiona la transición vía el historial del módulo audit (contrato de
    // dominio), no escribiendo su tabla directamente (evita DIRECT_CROSS_DOMAIN).
    await this.historyRepo.append(tx, 'appointment_bookings', booking.id, {
      operationConceptId: SCHED.HISTORY_OP_STATE_TRANSITION,
      dataSnapshot: {
        bookingId: booking.id,
        fromStateConceptId,
        toStateConceptId,
      },
      changedByUserId: actor.id,
    });
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
          : [...ACTIVE_BOOKING_STATES],
      },
      limit + 1,
    );
    // Dos formas de quedarse corto, y las dos se declaran: sobrar filas para
    // esta página, o que la lectura previa al filtro por ventana agotara su
    // tope. La segunda no se ve en `rows.length` —el filtro pudo dejar menos de
    // `limit`— y callarla devolvería una agenda incompleta como si fuera toda.
    const truncated = rows.length > limit || fetchCapReached;
    const page = rows.length > limit ? rows.slice(0, limit) : rows;

    return {
      items: page.map(({ booking, slot }) => ({
        id: booking.id,
        patientProfileId: booking.patientProfileId,
        resourceId: booking.resourceId,
        bookableSlotId: booking.bookableSlotId,
        startAt: slot?.startAt ?? null,
        endAt: slot?.endAt ?? null,
        statusConceptId: booking.statusConceptId,
        serviceConceptId: booking.serviceConceptId,
        bookingChannelConceptId: booking.bookingChannelConceptId,
        confirmedAt: booking.confirmedAt,
        checkedInAt: booking.checkedInAt,
        reasonText: booking.reasonText,
        createdAt: booking.createdAt,
      })),
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
  async getBookingById(bookingId: string): Promise<BookingItemDto> {
    const em = this.em.fork();
    const booking = await this.bookingsRepo.findBookingById(em, bookingId);
    if (!booking) {
      throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
    }
    const slot = booking.bookableSlotId
      ? await this.bookingsRepo.findSlotById(em, booking.bookableSlotId)
      : null;

    return {
      id: booking.id,
      patientProfileId: booking.patientProfileId,
      resourceId: booking.resourceId,
      bookableSlotId: booking.bookableSlotId,
      startAt: slot?.startAt ?? null,
      endAt: slot?.endAt ?? null,
      statusConceptId: booking.statusConceptId,
      serviceConceptId: booking.serviceConceptId,
      bookingChannelConceptId: booking.bookingChannelConceptId,
      confirmedAt: booking.confirmedAt,
      checkedInAt: booking.checkedInAt,
      reasonText: booking.reasonText,
      createdAt: booking.createdAt,
    };
  }

  /** Política efectiva del slot, heredada de su plantilla. */
  private async resolvePolicy(tx: EntityManager, templateId: string) {
    const template = await this.catalogRepo.findTemplateById(tx, templateId);
    if (!template?.bookingPolicyId) return null;
    return this.catalogRepo.findPolicyById(tx, template.bookingPolicyId);
  }
}
