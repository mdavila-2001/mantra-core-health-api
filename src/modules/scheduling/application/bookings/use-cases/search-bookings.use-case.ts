import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  BOOKING_HISTORY_PORT,
  type BookingHistoryPort,
} from '../../ports/booking-history.port';
import { BookingAccess } from '../support/booking-access';
import {
  BookingInsuranceClaimDto,
  SearchBookingsResponseDto,
} from '../../../presentation/dto';
import { BookingItemAssembler } from '../support/booking-item-assembler';
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
import {
  PATIENT_REPRESENTATION_PORT,
  type PatientRepresentationPort,
} from '../../ports/patient-representation.port';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import { VISIBLE_BOOKING_STATES } from '../../../domain/booking/booking-states';
import {
  hasReason,
  isDelay,
} from '../../../domain/booking/booking-history-reading';
import { isPatientActor } from '../../../domain/booking/agenda-actors';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** UC-41-15: listado de citas por paciente, recurso y/o ventana temporal. */
@Injectable()
export class SearchBookingsUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: BookingAccess,
    @Inject(BOOKING_HISTORY_PORT)
    private readonly history: BookingHistoryPort,
    @Inject(CLINICAL_APPOINTMENTS_PORT)
    private readonly clinical: ClinicalAppointmentsPort,
    @Inject(INSURANCE_READ_PORT)
    private readonly insurance: InsuranceReadPort,
    @Inject(PATIENT_REPRESENTATION_PORT)
    private readonly representation: PatientRepresentationPort,
    private readonly assembler: BookingItemAssembler,
  ) {}

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
  async execute(
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
        {},
        SchedulingErrorReason.SEARCH_FILTER_REQUIRED,
      );
    }
    // Una cuenta de paciente sólo lista lo suyo y lo de quienes representa. Sin
    // esto, el filtro por paciente era una enumeración de la agenda ajena a
    // quien supiera un uuid: los turnos de alguien dicen a qué médico va y por
    // qué. No alcanza a quien atiende ni al mostrador — ver `isPatientActor`.
    if (filters.patientProfileId && actor) {
      await this.access.assertMayActForPatient(filters.patientProfileId, actor);
    }
    if (filters.from && filters.to && !(filters.from < filters.to)) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        {
          from: filters.from.toISOString(),
          to: filters.to.toISOString(),
        },
        SchedulingErrorReason.AGENDA_WINDOW_INVERTED,
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
    const reasons = await this.history.latestByBooking(
      em,
      page.map(({ booking }) => booking.id),
      hasReason,
    );
    // Segunda pasada sobre el mismo historial, con otro predicado: la demora
    // (P8) no es un motivo de cambio de estado y `latestBySource` devuelve una
    // revisión por agregado, así que pedir las dos cosas juntas dejaría fuera
    // la que llegó antes.
    const delays = await this.history.latestByBooking(
      em,
      page.map(({ booking }) => booking.id),
      isDelay,
    );

    const origins = await this.bookingsRepo.latestRescheduleOrigins(
      em,
      page.map(({ booking }) => booking.id),
    );

    // Los recursos de la página, en lote y sólo si el actor es un profesional:
    // es lo único que puede convertir «esta cita es de alguien» en «esta cita
    // es MÍA» para decidir el motivo. Un paciente no los necesita.
    const agendaOwners = new Map<string, string>();
    if (actor?.practitionerProfileId !== undefined) {
      const ids = [
        ...new Set(
          page
            .map(({ booking }) => booking.resourceId)
            .filter((id): id is string => id !== undefined),
        ),
      ];
      for (const id of ids) {
        const resource = await this.catalogRepo.findResourceById(em, id);
        if (resource) agendaOwners.set(id, resource.resourceRefId);
      }
    }

    // La tipología de la página, en lote. Sólo las citas que llegaron a tener
    // contraparte clínica la tienen: una reserva sin confirmar no crea
    // `clinical.appointments`, así que su id no entra en la consulta.
    const appointmentIds = [
      ...new Set(
        page
          .map(({ booking }) => booking.appointmentId)
          .filter((id): id is string => id != null),
      ),
    ];
    const types = await this.clinical.findTypesByIds(em, appointmentIds);

    // El encuentro clínico de cada cita, en lote (subtarea 4.3): mismos ids
    // que la tipología, misma razón — cien consultas más por página, no.
    const encounters = await this.clinical.findLatestEncounterIds(
      em,
      appointmentIds,
    );

    // A quiénes representa el actor, una vez para toda la página (B.1). Decide
    // si el motivo de consulta de la cita de un dependiente se le muestra a
    // quien lo pidió. Sólo se pregunta a una cuenta de paciente: al mostrador y
    // a quien atiende el motivo ya se les decide por otro camino.
    const representedPatients = isPatientActor(actor)
      ? await this.representation.findActiveProxiedPatientIds(actor!.id, em)
      : undefined;

    // Los nombres, en lote y sólo cuando alguien va a poder verlos: si el actor
    // no es profesional ni titular, la proyección los descartaría igual y la
    // consulta sería trabajo tirado.
    const names =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.bookingsRepo.findPatientNames(em, [
            ...new Set(page.map(({ booking }) => booking.patientProfileId)),
          ])
        : new Map<string, string>();

    // El estado de pago de la página, en lote (TAREA-13 punto 5). Una consulta
    // para toda la página, no una por fila.
    const payments = await this.bookingsRepo.findPaymentStatesForBookings(
      em,
      page.map(({ booking }) => booking.id),
    );

    // La aseguradora de cada paciente, en lote (ALV-021). Sólo se pide para
    // quien de todos modos va a poder ver el nombre del paciente: es el mismo
    // dato de privacidad, y pedirla para el resto sería trabajo tirado.
    const carriers =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.insurance.findActiveCarriersByPatients(em, [
            ...new Set(page.map(({ booking }) => booking.patientProfileId)),
          ])
        : new Map<string, string>();

    // La solicitud de seguro de cada cita, en lote y con la misma compuerta
    // que la aseguradora: es otro dato del paciente, y pedirlo para quien no lo
    // va a ver sería trabajo tirado. Tres consultas fijas por página.
    const requests =
      actor?.practitionerProfileId !== undefined ||
      actor?.patientProfileId !== undefined
        ? await this.assembler.insuranceClaimsByAppointment(em, appointmentIds)
        : new Map<string, BookingInsuranceClaimDto>();

    // P42: los dos lados del vínculo de reconsulta, en lote para la página.
    const followUps = await this.assembler.followUpLinks(
      em,
      page.map(({ booking }) => booking),
    );

    return {
      items: page.map(({ booking, slot }) =>
        this.assembler.toBookingItem(
          booking,
          slot,
          reasons.get(booking.id),
          delays.get(booking.id),
          actor,
          booking.resourceId ? agendaOwners.get(booking.resourceId) : undefined,
          origins.get(booking.id),
          names.get(booking.patientProfileId),
          booking.appointmentId == null
            ? undefined
            : types.get(booking.appointmentId),
          payments.get(booking.id),
          carriers,
          booking.appointmentId == null
            ? undefined
            : encounters.get(booking.appointmentId),
          requests,
          representedPatients,
          followUps,
        ),
      ),
      count: page.length,
      limit,
      truncated,
    };
  }
}
