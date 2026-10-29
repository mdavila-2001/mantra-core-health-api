import {
  CONCEPTS,
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../../common';
import type { BookingChange } from '../../../domain/notices/agenda-notices';
import { CancelBookingUseCase } from '../../bookings/use-cases/cancel-booking.use-case';
import type { EntityManager } from '@mikro-orm/postgresql';
import { EXCEPTION_TYPE_LABEL } from '../../../domain/catalog/catalog-concepts';
import type { ExceptionType } from '../../../domain/catalog/catalog-types';
import { Injectable } from '@nestjs/common';
import { PENDING_BOOKING_STATES } from '../../../domain/booking/booking-states';
import { SCHED } from '../../../domain/scheduling.concepts';
import type { BookableSlots } from '../../../entities';
import {
  SchedulingCatalogRepository,
  SchedulingNoticeRepository,
} from '../../../infrastructure/repositories';

/**
 * Las citas que un bloqueo puede cancelar: las confirmadas y las que todavía
 * esperan respuesta. Una pendiente no se «cancela», se rechaza — el aviso es
 * otro (P8) — y acá se distingue por `pending`.
 */
export const BLOCK_CANCELLABLE_STATES: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  ...PENDING_BOOKING_STATES,
];

/**
 * La persona ya está en el consultorio. Eso no se cancela desde un bloqueo:
 * quien la recibió la atiende o la cancela mirándola a la cara.
 */
export const PRESENT_BOOKING_STATES: readonly string[] = [
  CONCEPTS.BOOKING_CHECKED_IN,
  SCHED.BOOKING_IN_PROGRESS,
];

/** El código con el que la pantalla reconoce «hay citas: confirme». */
export const BOOKINGS_REQUIRE_CONFIRMATION = 'BOOKINGS_REQUIRE_CONFIRMATION';

/**
 * El motivo que lee el paciente cuando su cita cae por retirar o cambiar el
 * horario de atención (etapa C, 24/10/2026).
 */
export const SCHEDULE_CHANGE_CANCELLATION_REASON =
  'Cambio en el horario de atención del profesional';

/** Una cita que el bloqueo alcanza, como se la muestra al profesional. */
export interface AffectedBooking {
  readonly bookingId: string;
  readonly startAt: string;
  readonly endAt: string;
  /** El nombre del paciente, o `null` si no se pudo resolver. */
  readonly patientName: string | null;
  /** Todavía sin responder: se rechaza en vez de cancelarse. */
  readonly pending: boolean;
}

export interface AffectedBookings {
  readonly cancellable: readonly AffectedBooking[];
  readonly present: readonly AffectedBooking[];
}

/** Una cita ya cancelada en la transacción, pendiente sólo de avisar. */
export interface CancelledByBlock {
  readonly bookingId: string;
  readonly change: BookingChange;
  readonly reason: string;
}

/**
 * Lo que un bloqueo de agenda hace con las citas que pisa.
 *
 * ## Qué cambió y por qué (24/10/2026)
 *
 * Hasta acá, bloquear un rato con una cita confirmada respondía 422 y no
 * bloqueaba: «Reprográmela primero». El propietario pidió lo contrario — que
 * el bloqueo **cancele** las citas del rato y **avise** a cada paciente —, con
 * una condición: el profesional ve antes cuántas y cuáles son, y confirma.
 *
 * ## Dos pasos, un solo cuerpo
 *
 * 1. Sin `cancelAffectedBookings`, si hay citas se responde 422 con la lista
 *    completa (`affectedBookings`): es la vista previa que la pantalla muestra.
 *    **Nada se cancela.**
 * 2. Con `cancelAffectedBookings: true`, cada cita se cancela por el mismo
 *    camino que una cancelación a mano (`CancelBookingUseCase`), con el motivo
 *    del bloqueo y el profesional como actor, **dentro de la transacción del
 *    bloqueo**. Los avisos salen después del commit (`announce`).
 *
 * Reusar el caso de uso de cancelar es lo que garantiza que una cita cancelada
 * por bloqueo deja el mismo rastro —cancelación con motivo, transición, aviso—
 * que una cancelada desde su ficha.
 */
@Injectable()
export class BlockedBookingsCanceller {
  constructor(
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly noticeRepo: SchedulingNoticeRepository,
    private readonly cancelBooking: CancelBookingUseCase,
  ) {}

  /** Las citas vivas de esos cupos, separadas en cancelables y presentes. */
  async describe(
    tx: EntityManager,
    slots: readonly BookableSlots[],
    authorize?: () => void,
  ): Promise<AffectedBookings> {
    if (slots.length === 0) return { cancellable: [], present: [] };

    const slotById = new Map(slots.map((slot) => [slot.id, slot]));
    const slotIds = [...slotById.keys()];

    const cancellable = await this.catalogRepo.findBookingsOfSlots(
      tx,
      slotIds,
      BLOCK_CANCELLABLE_STATES,
    );
    const present = await this.catalogRepo.findBookingsOfSlots(
      tx,
      slotIds,
      PRESENT_BOOKING_STATES,
    );

    // Con citas de por medio, quien pide tiene que poder verlas: se comprueba
    // ANTES de resolver un solo nombre. Sin citas no hay nada que proteger, y
    // bloquear un rato vacío sigue como siempre.
    if (cancellable.length + present.length > 0) authorize?.();

    const describe = async (
      bookingId: string,
      patientProfileId: string,
      slotId: string,
      statusConceptId: string,
    ): Promise<AffectedBooking> => {
      const slot = slotById.get(slotId);
      return {
        bookingId,
        startAt: slot?.startAt.toISOString() ?? '',
        endAt: (slot?.endAt ?? slot?.startAt)?.toISOString() ?? '',
        patientName: await this.noticeRepo.findDisplayNameForProfile(
          tx,
          patientProfileId,
        ),
        pending: PENDING_BOOKING_STATES.includes(statusConceptId),
      };
    };

    const described: AffectedBooking[] = [];
    for (const b of cancellable) {
      described.push(
        await describe(
          b.id,
          b.patientProfileId,
          b.bookableSlotId,
          b.statusConceptId,
        ),
      );
    }
    const presentDescribed: AffectedBooking[] = [];
    for (const b of present) {
      presentDescribed.push(
        await describe(
          b.id,
          b.patientProfileId,
          b.bookableSlotId,
          b.statusConceptId,
        ),
      );
    }
    return { cancellable: described, present: presentDescribed };
  }

  /** Un paciente ya recibido no se cancela por bloqueo: 422, siempre. */
  assertNobodyPresent(
    present: readonly AffectedBooking[],
    resourceId: string,
  ): void {
    if (present.length === 0) return;
    throw new PreconditionFailedException(
      'Hay un paciente ya recibido en ese rato. Atiéndalo o cancele su cita desde la agenda antes de bloquear.',
      {
        resourceId,
        bookingIds: present.map((b) => b.bookingId),
      },
    );
  }

  /**
   * Sin confirmación explícita, las citas alcanzadas frenan el bloqueo con la
   * lista completa: es la vista previa. El `failureCode` es lo que la pantalla
   * reconoce para ofrecer «Bloquear y cancelar».
   */
  assertConfirmed(
    cancellable: readonly AffectedBooking[],
    confirmed: boolean | undefined,
  ): void {
    if (cancellable.length === 0 || confirmed === true) return;
    const n = cancellable.length;
    throw new PreconditionFailedException(
      `Ese rato tiene ${n} ${n === 1 ? 'cita' : 'citas'} con paciente. Confirme para cancelarlas y avisar a cada persona.`,
      {
        failureCode: BOOKINGS_REQUIRE_CONFIRMATION,
        affectedBookings: cancellable,
      },
    );
  }

  /**
   * Cancela cada cita dentro de `tx`. Las pendientes se rechazan (`REJECTED`):
   * a quien todavía no tenía turno no se le dice «su cita se canceló».
   */
  async cancelAll(
    tx: EntityManager,
    affected: readonly AffectedBooking[],
    actor: AuthenticatedUser,
    reasonText: string,
  ): Promise<CancelledByBlock[]> {
    const cancelled: CancelledByBlock[] = [];
    for (const booking of affected) {
      const change: BookingChange = booking.pending ? 'REJECTED' : 'CANCELLED';
      const done = await this.cancelBooking.cancelInTransaction(
        tx,
        booking.bookingId,
        { cancelledBy: 'PROVIDER', reasonText },
        actor,
        change,
      );
      cancelled.push({
        bookingId: booking.bookingId,
        change,
        reason: done.reason,
      });
    }
    return cancelled;
  }

  /**
   * Los avisos, uno por cita, **después** del commit del bloqueo.
   *
   * No se promueve la lista de espera: el cupo que cada cancelación devolvió
   * quedó bloqueado en la misma transacción, y avisarle a alguien de un
   * horario que no puede reservar sería peor que no avisar.
   */
  async announce(cancelled: readonly CancelledByBlock[]): Promise<void> {
    for (const c of cancelled) {
      await this.cancelBooking.announceChange(
        c.bookingId,
        c.change,
        c.reason,
        'PROVIDER',
      );
    }
  }
}

/**
 * El motivo que llevan las citas canceladas por un bloqueo: el del catálogo y,
 * si el profesional escribió algo, su texto. Es lo que el paciente lee en
 * «Motivo: …» del aviso.
 */
export function blockCancellationReason(
  exceptionType: ExceptionType,
  reason: string | undefined,
): string {
  const label = EXCEPTION_TYPE_LABEL[exceptionType];
  const text = reason?.trim() ?? '';
  return text === ''
    ? `Bloqueo de agenda: ${label}`
    : `Bloqueo de agenda (${label}): ${text}`;
}
