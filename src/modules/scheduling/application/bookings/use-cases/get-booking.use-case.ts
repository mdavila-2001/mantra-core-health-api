import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  BOOKING_HISTORY_PORT,
  type BookingHistoryPort,
} from '../../ports/booking-history.port';
import { BookingAccess } from '../support/booking-access';
import { BookingItemAssembler } from '../support/booking-item-assembler';
import { BookingItemDto } from '../../../presentation/dto';
import {
  CLINICAL_APPOINTMENTS_PORT,
  type ClinicalAppointmentsPort,
} from '../../ports/clinical-appointments.port';
import { EntityManager } from '@mikro-orm/postgresql';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  PATIENT_REPRESENTATION_PORT,
  type PatientRepresentationPort,
} from '../../ports/patient-representation.port';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import {
  hasReason,
  isDelay,
} from '../../../domain/booking/booking-history-reading';
import {
  isPatientActor,
  operatesAnyAgenda,
} from '../../../domain/booking/agenda-actors';

/** UC-41-15: una cita concreta. */
@Injectable()
export class GetBookingUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: BookingAccess,
    @Inject(BOOKING_HISTORY_PORT)
    private readonly history: BookingHistoryPort,
    @Inject(CLINICAL_APPOINTMENTS_PORT)
    private readonly clinical: ClinicalAppointmentsPort,
    @Inject(PATIENT_REPRESENTATION_PORT)
    private readonly representation: PatientRepresentationPort,
    private readonly assembler: BookingItemAssembler,
  ) {}

  /**
   * UC-41-15: una cita concreta.
   *
   * @param bookingId - Cita a leer.
   * @returns La cita con su instante resuelto desde el slot.
   * @throws ResourceNotFoundException si no existe.
   */
  async execute(
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
    const reasons = await this.history.latestByBooking(
      em,
      [booking.id],
      hasReason,
    );
    const delays = await this.history.latestByBooking(
      em,
      [booking.id],
      isDelay,
    );

    const origins = await this.bookingsRepo.latestRescheduleOrigins(em, [
      booking.id,
    ]);

    // Sólo se busca el recurso si hace falta para decidir el motivo: un
    // paciente titular ya tiene permiso sin mirar la agenda.
    const resource =
      booking.resourceId && actor?.practitionerProfileId !== undefined
        ? await this.catalogRepo.findResourceById(em, booking.resourceId)
        : null;

    // H3.S1.M1 (BOLA/IDOR de lectura): el detalle no comprobaba de quién era
    // la cita — devolvía nombre, motivo y horario a cualquier cuenta con rol
    // de agenda. Mismo criterio que `loadForOperation`: el paciente titular o
    // su representante, quien opera cualquier agenda (`SCHEDULING_ADMIN`,
    // `SCHEDULING_AGENT`, `SUPERADMIN`), o quien atiende exactamente en ese
    // recurso. Reusa el `recurso` de arriba: no agrega una consulta nueva.
    if (isPatientActor(actor)) {
      await this.access.assertMayActForPatient(
        booking.patientProfileId,
        actor!,
        em,
      );
    } else if (actor && !operatesAnyAgenda(actor)) {
      const isOwnAgenda =
        actor.practitionerProfileId !== undefined &&
        resource !== null &&
        resource.resourceRefId === actor.practitionerProfileId &&
        PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType);
      if (!isOwnAgenda) {
        throw new ForbiddenException(
          'Esta cita es de otra agenda: solo la opera quien atiende en ella.',
        );
      }
    }

    // El detalle tiene que decir exactamente lo mismo que el listado, así que
    // la tipología también se resuelve acá. Una sola cita: el lote de uno es la
    // misma consulta.
    const types =
      booking.appointmentId == null
        ? new Map<string, string>()
        : await this.clinical.findTypesByIds(em, [booking.appointmentId]);

    // El encuentro de la cita, mismo criterio (subtarea 4.3): lote de uno.
    const encounters =
      booking.appointmentId == null
        ? new Map<string, string>()
        : await this.clinical.findLatestEncounterIds(em, [
            booking.appointmentId,
          ]);

    // El detalle dice lo mismo que el listado también en esto: quien representa
    // al paciente ve el motivo que él mismo escribió al pedir el turno.
    const representedPatients = isPatientActor(actor)
      ? await this.representation.findActiveProxiedPatientIds(actor!.id, em)
      : undefined;

    return this.assembler.toBookingItem(
      booking,
      slot,
      reasons.get(booking.id),
      delays.get(booking.id),
      actor,
      resource?.resourceRefId,
      origins.get(booking.id),
      undefined,
      booking.appointmentId == null
        ? undefined
        : types.get(booking.appointmentId),
      undefined,
      undefined,
      booking.appointmentId == null
        ? undefined
        : encounters.get(booking.appointmentId),
      undefined,
      representedPatients,
      // P42: el detalle dice lo mismo que el listado; lote de uno.
      await this.assembler.followUpLinks(em, [booking]),
    );
  }
}
