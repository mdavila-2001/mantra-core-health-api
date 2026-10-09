import {
  AppointmentPaymentStates,
  type AppointmentBookings,
} from '../../../entities';
import type { AuthenticatedUser } from '../../../../../common';
import {
  BookingFollowUpOriginDto,
  BookingInsuranceClaimDto,
  BookingItemDto,
} from '../../../presentation/dto';
import type { BookingHistoryRevision } from '../../ports/booking-history.port';
import {
  CLINICAL_APPOINTMENTS_PORT,
  type ClinicalAppointmentsPort,
} from '../../ports/clinical-appointments.port';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  INSURANCE_READ_PORT,
  type InsuranceReadPort,
} from '../../ports/insurance-read.port';
import { Inject, Injectable } from '@nestjs/common';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { VISIBLE_BOOKING_STATES } from '../../../domain/booking/booking-states';
import { canSeeBookingReason } from '../../../domain/booking/booking-reason-visibility.policy';
import {
  projectPaymentState,
  toDelayNotice,
  toStatusReason,
} from './booking-projections';

/**
 * Una cita como la devuelven las dos lecturas (listado y detalle).
 *
 * Está en un solo lugar porque el listado y el detalle tienen que decir
 * exactamente lo mismo: cuando el mapeo estaba duplicado, agregar un campo en
 * uno y olvidarlo en el otro hacía que el detalle contradijera a la fila que
 * lo abrió.
 */
/** P42: cómo se proyectan los dos lados del vínculo de reconsulta de una cita. */
export interface FollowUpLinks {
  /** La consulta de origen, o `null` si la cita no es una reconsulta. */
  followUpOf: (booking: AppointmentBookings) => BookingFollowUpOriginDto | null;
  /** La reconsulta viva que salió de la cita, o `null`. */
  followUpBookingId: (booking: AppointmentBookings) => string | null;
}

@Injectable()
export class BookingItemAssembler {
  constructor(
    private readonly bookingsRepo: SchedulingBookingsRepository,
    @Inject(CLINICAL_APPOINTMENTS_PORT)
    private readonly clinical: ClinicalAppointmentsPort,
    @Inject(INSURANCE_READ_PORT)
    private readonly insurance: InsuranceReadPort,
  ) {}

  /**
   * Una cita como la devuelven las dos lecturas.
   *
   * Está en un solo lugar porque el listado y el detalle tienen que decir
   * exactamente lo mismo: cuando el mapeo estaba duplicado, agregar un campo en
   * uno y olvidarlo en el otro hacía que el detalle contradijera a la fila que
   * lo abrió.
   */
  /**
   * P42 · Los dos lados del vínculo de reconsulta de un lote de citas.
   *
   * `followUpOf` sale de la columna de la propia cita, con el instante del
   * origen y su encuentro resueltos acá —una consulta por salto, no una por
   * fila—. `followUpBookingId` se DERIVA: la reconsulta viva (estados
   * visibles: ni cancelada ni ausente) más reciente que apunta a la cita. El
   * vínculo se guarda en un solo lado para que no haya dos verdades.
   *
   * @param em - Contexto de persistencia.
   * @param bookings - Citas a proyectar.
   * @returns Dos funciones de proyección por cita.
   */
  async followUpLinks(
    em: EntityManager,
    bookings: readonly AppointmentBookings[],
  ): Promise<FollowUpLinks> {
    const originIds = [
      ...new Set(
        bookings
          .map((b) => b.followUpOfBookingId)
          .filter((id): id is string => id != null),
      ),
    ];
    const origins = await this.bookingsRepo.findBookingsWithSlotsByIds(
      em,
      originIds,
    );
    const originById = new Map(origins.map((o) => [o.booking.id, o]));
    const originAppointments = [
      ...new Set(
        origins
          .map(({ booking }) => booking.appointmentId)
          .filter((id): id is string => id != null),
      ),
    ];
    const encounters = await this.clinical.findLatestEncounterIds(
      em,
      originAppointments,
    );

    const children = await this.bookingsRepo.findFollowUpsOf(
      em,
      bookings.map((b) => b.id),
      VISIBLE_BOOKING_STATES,
    );
    // Vienen de la más reciente a la más antigua: la primera por origen gana.
    const followUpByOrigin = new Map<string, string>();
    for (const { booking } of children) {
      const originBooking = booking.followUpOfBookingId;
      if (originBooking != null && !followUpByOrigin.has(originBooking)) {
        followUpByOrigin.set(originBooking, booking.id);
      }
    }

    return {
      followUpOf: (booking) => {
        if (booking.followUpOfBookingId == null) return null;
        const originBooking = originById.get(booking.followUpOfBookingId);
        const originAppointmentId = originBooking?.booking.appointmentId;
        return {
          bookingId: booking.followUpOfBookingId,
          encounterId:
            originAppointmentId == null
              ? null
              : (encounters.get(originAppointmentId) ?? null),
          startAt: originBooking?.slot?.startAt ?? null,
          ...(booking.formInstanceId == null
            ? {}
            : { formInstanceId: booking.formInstanceId }),
        };
      },
      followUpBookingId: (booking) => followUpByOrigin.get(booking.id) ?? null,
    };
  }

  /**
   * La solicitud de seguro más reciente de cada cita, indexada por `appointmentId`.
   *
   * El camino es cita → encuentros → solicitudes, y se recorre en lote: una
   * consulta por salto, no una por fila. Se miran **todos** los encuentros de
   * la cita y no sólo el último, porque la solicitud puede colgar de
   * cualquiera. El repositorio ya devuelve las solicitudes ordenadas de la más
   * reciente a la más vieja, así que la primera que aparece por cita es la que
   * gana.
   *
   * Una cita sin solicitud no entra en el mapa: quien proyecta traduce esa
   * ausencia a `null`.
   *
   * @param em - Contexto de persistencia.
   * @param appointmentIds - Citas clínicas de la página, sin repetidos.
   * @returns Mapa `appointmentId` → resumen de la solicitud.
   */
  async insuranceClaimsByAppointment(
    em: EntityManager,
    appointmentIds: readonly string[],
  ): Promise<Map<string, BookingInsuranceClaimDto>> {
    const byAppointment = new Map<string, BookingInsuranceClaimDto>();
    if (appointmentIds.length === 0) return byAppointment;

    const encountersByAppointment = await this.clinical.findEncounterIds(
      em,
      appointmentIds,
    );
    const appointmentByEncounter = new Map<string, string>();
    for (const [booking, encounters] of encountersByAppointment) {
      for (const encounter of encounters) {
        appointmentByEncounter.set(encounter, booking);
      }
    }
    if (appointmentByEncounter.size === 0) return byAppointment;

    const summaries = await this.insurance.findClaimSummariesByEncounterIds(
      em,
      [...appointmentByEncounter.keys()],
    );
    for (const summary of summaries) {
      const booking = appointmentByEncounter.get(summary.encounterId);
      if (booking === undefined || byAppointment.has(booking)) continue;
      byAppointment.set(booking, {
        id: summary.id,
        claimIdentifier: summary.claimIdentifier,
        statusCode: summary.statusCode,
        statusDisplay: summary.statusDisplay,
        submittedAt: summary.submittedAt?.toISOString() ?? null,
      });
    }
    return byAppointment;
  }

  toBookingItem(
    booking: AppointmentBookings,
    slot: { startAt: Date; endAt?: Date } | null,
    reason: BookingHistoryRevision | undefined,
    delay?: BookingHistoryRevision,
    actor?: AuthenticatedUser,
    agendaPractitioner?: string,
    rescheduledFrom?: Date,
    patientName?: string,
    appointmentType?: string,
    paymentState?: AppointmentPaymentStates,
    carrierByPatient?: Map<string, string>,
    appointmentEncounter?: string,
    claimByAppointment?: Map<string, BookingInsuranceClaimDto>,
    representedPatients?: ReadonlySet<string>,
    followUps?: FollowUpLinks,
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
      // Siempre presente, igual que `appointmentId`: `null` es «sin cita» o
      // «cita sin encuentro» — el frente cruza este id con
      // `ChartNote.encounterId` sin estimar por fecha.
      encounterId: appointmentEncounter ?? null,
      // Se OMITE cuando nadie lo marcó, y no viaja como «pendiente»: pendiente
      // de pago es una afirmación que alguien firmó, y la ausencia es que del
      // pago todavía no se dijo nada. Comprobalo con `if (item.paymentState)`.
      ...(paymentState
        ? { paymentState: projectPaymentState(paymentState) }
        : {}),
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
      ...(canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? { reasonText: booking.reasonText }
        : {}),
      // El nombre viaja con la MISMA regla que el motivo: lo ve el titular y el
      // profesional que atiende, no la vista de la organización. El médico
      // necesita saber a quién espera —es el pedido explícito del registro del
      // cliente— y la organización ya opera con el identificador.
      ...(patientName !== undefined &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? { patientName: patientName }
        : {}),
      // ALV-021: misma compuerta que el nombre. `null` es «se buscó y no
      // tiene» —Particular—; el campo entero se omite cuando quien mira no
      // puede ver al paciente, que es una pregunta distinta.
      ...(carrierByPatient !== undefined &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? {
            insuranceCarrierName:
              carrierByPatient.get(booking.patientProfileId) ?? null,
          }
        : {}),
      // La solicitud de seguro de la cita, con la misma compuerta y el mismo
      // trato del `null` que la aseguradora: `null` es «se buscó y no hay»
      // —también cuando la reserva todavía no tiene cita clínica, que no puede
      // tener solicitud—; ausente es «quien mira no puede verlo».
      ...(claimByAppointment !== undefined &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? {
            insuranceClaim:
              booking.appointmentId == null
                ? null
                : (claimByAppointment.get(booking.appointmentId) ?? null),
          }
        : {}),
      // La tipología viaja siempre que exista: no es dato clínico —es qué
      // clase de actividad ocupa el rato, lo mismo que ya dice la duración del
      // bloque— y sin ella la agenda del día no puede pintar una operación
      // distinto de una consulta. El motivo de consulta, que sí lo es, sigue
      // con su regla de arriba.
      // P42: el vínculo de reconsulta, con la misma compuerta que el nombre y
      // el motivo. Ausente = «no te corresponde verlo»; `null` = «se buscó y
      // no hay».
      ...(followUps !== undefined &&
      canSeeBookingReason(
        booking,
        actor,
        agendaPractitioner,
        representedPatients,
      )
        ? {
            followUpOf: followUps.followUpOf(booking),
            followUpBookingId: followUps.followUpBookingId(booking),
          }
        : {}),
      ...(appointmentType === undefined
        ? {}
        : { typeConceptId: appointmentType }),
      ...(rescheduledFrom ? { rescheduledFrom: rescheduledFrom } : {}),
      statusReason: toStatusReason(reason),
      delayNotice: toDelayNotice(delay),
      createdAt: booking.createdAt,
    };
  }
}
