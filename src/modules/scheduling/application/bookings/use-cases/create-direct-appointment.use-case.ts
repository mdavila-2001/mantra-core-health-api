import {
  ACTIVE_BOOKING_STATES,
  VISIBLE_BOOKING_STATES,
} from '../../../domain/booking/booking-states';
import {
  APPOINTMENT_CHANNEL_CONCEPT,
  CHANNEL_CONCEPT,
} from '../../../domain/booking/booking-channels';
import type { AppointmentBookings, BookableSlots } from '../../../entities';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { BookingAccess } from '../support/booking-access';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import { BookingTransitionRecorder } from '../support/booking-transition-recorder';
import { CLIN } from '../../../../clinical/clinical.concepts';
import {
  CLINICAL_APPOINTMENTS_PORT,
  type ClinicalAppointmentRef,
  type ClinicalAppointmentsPort,
} from '../../ports/clinical-appointments.port';
import { ClinicalAppointmentSync } from '../support/clinical-appointment-sync';
import {
  CreateDirectAppointmentDto,
  DirectAppointmentResponseDto,
} from '../../../presentation/dto';
import {
  DEFAULT_CANCELLATION_WINDOW_MINUTES,
  DEFAULT_REMINDER_OFFSETS,
} from '../../../domain/booking/booking-defaults';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  FORM_ORIGIN_PORT,
  type FormOriginPort,
} from '../../ports/form-origin.port';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { PinoLogger } from 'nestjs-pino';
import { SCHED } from '../../../domain/scheduling.concepts';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import { SchedulingProfessionalTimeService } from '../../professional-time/scheduling-professional-time.service';
import { cancellationWindowMinutes } from '../../../domain/booking/cancellation-policy';
import { operatesAnyAgenda } from '../../../domain/booking/agenda-actors';

/** AG-2 · La cita puntual: el doctor asigna, el paciente se entera. */
@Injectable()
export class CreateDirectAppointmentUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly access: BookingAccess,
    private readonly clinicalSync: ClinicalAppointmentSync,
    private readonly transitions: BookingTransitionRecorder,
    private readonly notifier: BookingChangeNotifier,
    @Inject(CLINICAL_APPOINTMENTS_PORT)
    private readonly clinical: ClinicalAppointmentsPort,
    @Inject(FORM_ORIGIN_PORT)
    private readonly formOrigin: FormOriginPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateDirectAppointmentUseCase.name);
  }

  /**
   * AG-2 · La cita puntual: el doctor asigna, el paciente se entera.
   *
   * ## El diseño (decidido, no reabrir)
   *
   * **Cita puntual = un cupo de una sola vez + su reserva, en la MISMA
   * transacción.** Cero modelo nuevo: para el resto del sistema ES una reserva
   * más, así que hereda recordatorios, estados, check-in, demora, cancelación,
   * el archivo del paciente, la regla madre y el gating de sede — todo gratis.
   *
   * Nace CONFIRMADA: «volvé el jueves a las 10» ya se acordó en el consultorio.
   * El paciente recibe la campana con la salida de «pedir cambio» — salida, no
   * paso obligatorio.
   *
   * ## La retracción (decisión 8 del README de agenda)
   *
   * Si el rato pisa cupos ofrecidos NO tomados del mismo profesional —en
   * cualquiera de sus sedes— esos cupos se retiran acá mismo y la respuesta
   * informa cuántos. Informar, no pedir permiso. Sobre confirmadas → la regla
   * madre rechaza, como siempre.
   *
   * ## Anti-abuso mínimo, documentado
   *
   * El paciente tiene que existir. La relación previa (sus pacientes atendidos
   * primero) la gobierna el buscador del front — exigirla acá bloquearía el
   * caso legítimo del paciente nuevo que acaba de salir de la primera consulta.
   * Queda el registro estructurado de quién agendó a quién.
   *
   * @param dto - Paciente, agenda, inicio, duración y motivo.
   * @param actor - El doctor (su propia agenda) o quien administra agendas.
   * @returns La reserva confirmada y cuántos cupos ofrecidos retiró.
   */
  async execute(
    dto: CreateDirectAppointmentDto,
    actor: AuthenticatedUser,
  ): Promise<DirectAppointmentResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.appointment.direct',
        resourceId: dto.resourceId,
        patientProfileId: dto.patientProfileId,
        startAt: dto.startAt,
        durationMinutes: dto.durationMinutes,
      },
      'Creating direct appointment',
    );

    const { booking, slot, retractedSlots } = await this.em.transactional(
      (tx) => this.executeInTransaction(tx, dto, actor),
    );
    const result: DirectAppointmentResponseDto = {
      bookingId: booking.id,
      bookableSlotId: slot.id,
      statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      retractedSlots,
    };

    // Fuera de la transacción, como todos los avisos: que no salga la campana
    // no puede deshacer una cita que ya existe.
    await this.notifier.notifyChange(
      result.bookingId,
      'ASSIGNED',
      dto.reasonText,
      'PROVIDER',
    );
    return result;
  }

  /**
   * El cuerpo transaccional de {@link createDirectAppointment}, para casos de
   * uso que ya abrieron su propia transacción (el mostrador atómico, AC-3.3).
   *
   * Mismo camino que la cita puntual: recurso, titularidad de agenda, vínculo
   * vigente, existencia del paciente, regla madre, solape del paciente,
   * retracción de cupos libres, cupo único, cita clínica y reserva
   * `BOOKING_CONFIRMED`. El canal de la reserva es parametrizable —por defecto
   * `DESK`, como la cita puntual de siempre— porque el mostrador lo abre como
   * `WALK_IN` sin que eso cambie ninguna otra regla.
   *
   * No dispara el aviso de campana: eso vive fuera de la transacción y es
   * responsabilidad de quien la abrió.
   *
   * @param tx - Contexto transaccional ya abierto por el llamador.
   * @param dto - Paciente, agenda, inicio, duración y motivo.
   * @param actor - El doctor (su propia agenda) o quien administra agendas.
   * @param options - Canal de reserva a grabar; por defecto `DESK`.
   * @returns La reserva confirmada, el cupo, la cita clínica y cuántos cupos
   *   ofrecidos retiró.
   */
  async executeInTransaction(
    tx: EntityManager,
    dto: CreateDirectAppointmentDto,
    actor: AuthenticatedUser,
    options?: { bookingChannel?: 'DESK' | 'WALK_IN' },
  ): Promise<{
    booking: AppointmentBookings;
    slot: BookableSlots;
    appointment: ClinicalAppointmentRef;
    retractedSlots: number;
  }> {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(startAt.getTime() + dto.durationMinutes * 60_000);

    const resource = await this.catalogRepo.findResourceById(
      tx,
      dto.resourceId,
    );
    if (!resource) {
      throw new ResourceNotFoundException('Recurso no encontrado', {
        resourceId: dto.resourceId,
      });
    }

    this.access.assertResourceInActiveTenant(resource.tenantId, actor);

    // La agenda tiene que ser SUYA (o el actor administra agendas por
    // oficio): mismo criterio de titularidad que operar una reserva.
    const isOwnAgenda =
      actor.practitionerProfileId !== undefined &&
      resource.resourceRefId === actor.practitionerProfileId &&
      PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType);
    if (!operatesAnyAgenda(actor) && !isOwnAgenda) {
      throw new ForbiddenException(
        'Un profesional solo puede asignar citas en su propia agenda.',
      );
    }

    // P42 · La reconsulta: sus cuatro rechazos corren SÓLO cuando viene
    // `followUpOf`; sin él la cita puntual sigue exactamente como antes.
    const followUp =
      dto.followUpOf === undefined
        ? undefined
        : await this.validateFollowUp(tx, dto, startAt, isOwnAgenda);

    // El gating del vínculo, heredado: comprometer un turno en una
    // organización exige que el vínculo siga vigente — misma regla que
    // aceptar.
    await this.access.assertAffiliationCurrent(resource.tenantId, actor);

    // Anti-abuso mínimo: el paciente tiene que existir.
    const names = await this.bookingsRepo.findPatientNames(tx, [
      dto.patientProfileId,
    ]);
    if (!names.has(dto.patientProfileId)) {
      throw new ResourceNotFoundException('Paciente no encontrado', {
        patientProfileId: dto.patientProfileId,
      });
    }

    // REGLA MADRE: nada se asigna sobre tiempo ya comprometido del
    // profesional, en ninguna de sus sedes.
    if (PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)) {
      await this.professionalTime.assertRangeFree(
        tx,
        resource.resourceRefId,
        startAt,
        endAt,
      );
    }

    // Y el tiempo del PACIENTE también: la regla 1 vale igual cuando quien
    // agenda es el doctor — el paciente tampoco puede estar en dos lugares.
    const alreadyCommitted =
      await this.bookingsRepo.findPatientBookingsOverlapping(
        tx,
        dto.patientProfileId,
        startAt,
        endAt,
        ACTIVE_BOOKING_STATES,
      );
    if (alreadyCommitted.length > 0) {
      const clash = alreadyCommitted[0];
      throw new PreconditionFailedException(
        `El paciente ya tiene una cita confirmada en ese rato${
          clash.resourceName ? ` en «${clash.resourceName}»` : ''
        }.`,
        { bookingId: clash.id, startAt: clash.startAt },
      );
    }

    // La retracción: los cupos libres del profesional que este rato pisa se
    // retiran acá mismo, en cualquiera de sus sedes.
    let retractedSlots = 0;
    if (PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)) {
      const freeOnes =
        await this.catalogRepo.findOpenSlotsOfProfessionalInWindow(
          tx,
          resource.resourceRefId,
          startAt,
          endAt,
          CONCEPTS.SLOT_OPEN,
        );
      for (const free of freeOnes) {
        // Retraído y no bloqueado: al bloqueado nadie lo devuelve, y al retraído sí
        // cuando esta cita se cancela (ver `discardOneOffSlot`).
        free.statusConceptId = SCHED.SLOT_RETRACTED;
        touch(free, actor.id);
        retractedSlots += 1;
      }
    }

    // El cupo único: nace ya tomado (capacity 1, remaining 0) y SIN
    // plantilla — un cupo puntual no tiene patrón semanal. Nadie más puede
    // reservarlo porque nunca estuvo ofrecido.
    const slot = this.catalogRepo.createSlot(tx, {
      resourceId: resource.id,
      startAt,
      endAt,
      capacity: 1,
      remainingCapacity: 0,
      statusConceptId: CONCEPTS.SLOT_BOOKED,
      actorUserId: actor.id,
    });
    await tx.flush();

    // La cita clínica que la respalda, ya reservada.
    const appointment = this.clinicalSync.createClinicalAppointment(tx, {
      tenantId: resource.tenantId,
      patientProfileId: dto.patientProfileId,
      resourceRefType: resource.resourceRefType,
      resourceRefId: resource.resourceRefId,
      startAt,
      endAt,
      reasonText: dto.reasonText,
      statusConceptId: CLIN.APPOINTMENT_BOOKED,
      // Ausente = presencial: no se escribe un valor que nadie eligió.
      ...(dto.channel === undefined
        ? {}
        : { channelConceptId: APPOINTMENT_CHANNEL_CONCEPT[dto.channel] }),
      // P42: la reconsulta se clasifica como tal; el resto, como hasta hoy.
      ...(followUp === undefined
        ? {}
        : { typeConceptId: CLIN.ACTIVITY_FOLLOW_UP }),
      actorUserId: actor.id,
    });
    await tx.flush();

    const confirmedAt = new Date();
    const booking = this.bookingsRepo.createBooking(tx, {
      tenantId: resource.tenantId,
      patientProfileId: dto.patientProfileId,
      appointmentId: appointment.id,
      bookableSlotId: slot.id,
      resourceId: resource.id,
      bookingChannelConceptId:
        CHANNEL_CONCEPT[options?.bookingChannel ?? 'DESK'],
      bookedByUserId: actor.id,
      statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
      confirmedAt,
      // Sin política publicada que congelar: los defaults del módulo, con la
      // zona de la sede como dato de auditoría.
      cancellationPolicySnapshot: {
        cancellationWindowMinutes: DEFAULT_CANCELLATION_WINDOW_MINUTES,
        timeZone: resource.timeZone ?? undefined,
        capturedAt: new Date().toISOString(),
      },
      reasonText: dto.reasonText,
      ...(followUp === undefined
        ? {}
        : {
            followUpOfBookingId: followUp.origin.id,
            formInstanceId: dto.followUpOf?.formInstanceId,
          }),
      actorUserId: actor.id,
    });
    await tx.flush();

    // Los recordatorios de siempre: la cita puntual es una reserva más.
    for (const offset of DEFAULT_REMINDER_OFFSETS) {
      this.bookingsRepo.createReminder(tx, {
        bookingId: booking.id,
        channelConceptId: CONCEPTS.REMINDER_CH_SMS,
        offsetMinutes: offset,
        scheduledAt: new Date(startAt.getTime() - offset * 60_000),
        statusConceptId: CONCEPTS.REMINDER_SCHEDULED,
        actorUserId: actor.id,
      });
    }

    await this.transitions.recordTransition(tx, booking, actor, {
      bookingId: booking.id,
      fromStateConceptId: CONCEPTS.BOOKING_CONFIRMED,
      toStateConceptId: CONCEPTS.BOOKING_CONFIRMED,
      reasonText: dto.reasonText,
      actorKind: 'PROVIDER',
    });

    return { booking, slot, appointment, retractedSlots };
  }

  /**
   * P42 · Las cuatro reglas de la reconsulta, en el orden del contrato, más la
   * del formulario de origen (P43).
   *
   * 1. **403** — la agenda no es del profesional de la sesión. Vale también
   *    para quien administra agendas: la reconsulta la agenda quien atendió.
   * 2. **404** — la cita de origen no existe.
   * 3. **422** — el paciente no es el de esa cita, o `startAt` no es futuro.
   * 4. **409** — esa consulta ya tiene una reconsulta por venir y no
   *    cancelada. Una ya pasada no bloquea.
   * 5. **422** (P43) — `formInstanceId` no existe, no está cerrada o es de
   *    otro encuentro que el de la consulta de origen.
   *
   * La unicidad es de la escritura, no de un `if` previo: la cita de origen se
   * lee con `SELECT … FOR UPDATE`, así que dos peticiones simultáneas con el
   * mismo origen se serializan y la segunda ya ve la reconsulta de la primera.
   *
   * @param tx - Transacción de la cita directa.
   * @param dto - Cuerpo con `followUpOf`.
   * @param startAt - Inicio pedido, ya parseado.
   * @param isOwnAgenda - Si el recurso es la agenda del profesional de la sesión.
   * @returns La cita de origen (bloqueada) y el encuentro que la atendió.
   */
  async validateFollowUp(
    tx: EntityManager,
    dto: CreateDirectAppointmentDto,
    startAt: Date,
    isOwnAgenda: boolean,
  ): Promise<{
    origin: AppointmentBookings;
    originEncounterId: string | null;
  }> {
    const requested = dto.followUpOf!;
    if (!isOwnAgenda) {
      throw new ForbiddenException(
        'La reconsulta se agenda en su propia agenda, no en la de otro profesional.',
      );
    }

    const originBooking = await this.bookingsRepo.findBookingByIdForUpdate(
      tx,
      requested.bookingId,
    );
    if (!originBooking) {
      throw new ResourceNotFoundException(
        'La cita de la que sale esta reconsulta no existe',
        { bookingId: requested.bookingId },
      );
    }
    if (originBooking.patientProfileId !== dto.patientProfileId) {
      throw new PreconditionFailedException(
        'La reconsulta es para el paciente de la cita de origen',
        { bookingId: originBooking.id, reason: 'FOLLOW_UP_PATIENT_MISMATCH' },
      );
    }
    const now = new Date();
    if (startAt.getTime() <= now.getTime()) {
      throw new PreconditionFailedException(
        'Una reconsulta se agenda para más adelante',
        { startAt: dto.startAt, reason: 'FOLLOW_UP_NOT_FUTURE' },
      );
    }

    const live = await this.bookingsRepo.findFollowUpsOf(
      tx,
      [originBooking.id],
      VISIBLE_BOOKING_STATES,
    );
    const upcoming = live.find(
      ({ slot }) => slot !== null && slot.startAt.getTime() > now.getTime(),
    );
    if (upcoming) {
      throw new ConflictException(
        'Esta consulta ya tiene una reconsulta agendada',
        {
          bookingId: upcoming.booking.id,
          startAt: upcoming.slot!.startAt.toISOString(),
        },
      );
    }

    // El encuentro de origen lo dice la base (cita → encuentro), no el
    // cliente: es contra él que se valida el formulario (P43).
    const originEncounterId =
      originBooking.appointmentId == null
        ? null
        : ((
            await this.clinical.findLatestEncounterIds(tx, [
              originBooking.appointmentId,
            ])
          ).get(originBooking.appointmentId) ?? null);

    if (requested.formInstanceId !== undefined) {
      await this.formOrigin.assertUsableOrigin(
        tx,
        requested.formInstanceId,
        originEncounterId,
      );
    }
    return { origin: originBooking, originEncounterId: originEncounterId };
  }
}
