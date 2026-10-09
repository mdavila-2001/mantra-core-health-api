import { ACTIVE_BOOKING_STATES } from '../../../domain/booking/booking-states';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import { BookingAccess } from './booking-access';
import {
  CHANNEL_CONCEPT,
  type BookingChannel,
} from '../../../domain/booking/booking-channels';
import { BookingResponseDto } from '../../../presentation/dto';
import { CLIN } from '../../../../clinical/clinical.concepts';
import type { CancellationPolicySnapshot } from '../../../entities';
import { ClinicalAppointmentSync } from './clinical-appointment-sync';
import { DEFAULT_CANCELLATION_WINDOW_MINUTES } from '../../../domain/booking/booking-defaults';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import { SchedulingProfessionalTimeService } from '../../professional-time/scheduling-professional-time.service';
import { SchedulingServiceAgendaService } from '../../service-offerings/scheduling-service-agenda.service';
import { SlotPolicyResolver } from './slot-policy-resolver';
import {
  freezeService,
  planForService,
} from '../../../domain/booking/service-booking-plan';

/**
 * Convierte una retención viva en reserva. Es el cuerpo común de confirmar y de
 * solicitar: las dos consumen el mismo hold, congelan la misma política, crean
 * la misma cita clínica y liberan el mismo cupo si algo falla.
 */

@Injectable()
export class BookingMaterializer {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly serviceAgenda: SchedulingServiceAgendaService,
    private readonly access: BookingAccess,
    private readonly clinicalSync: ClinicalAppointmentSync,
    private readonly slotPolicy: SlotPolicyResolver,
  ) {}

  /**
   * Convierte una retención viva en cita, en el estado que le corresponda.
   *
   * Es el cuerpo común de {@link confirmBooking} y {@link requestBooking}: las
   * dos consumen el mismo hold, congelan la misma política, crean la misma cita
   * clínica y liberan el mismo cupo si algo falla. Lo único que las distingue es
   * el estado con el que la cita nace y si ya hay compromiso (`confirmedAt`).
   */
  async materializeBooking(
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
    // Segundo cinturón del candado de B.1, y el que de verdad importa: el hold
    // puede haberse tomado sin declarar paciente —el cuerpo lo trae recién
    // acá—, así que comprobarlo sólo al retener dejaría la puerta abierta.
    // Cubre a la vez confirmar y solicitar, que es por lo que vive acá.
    await this.access.assertMayActForPatient(plan.patientProfileId, actor);

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

      // REGLA 1: no se puede pedir un turno encima de uno YA ACEPTADO.
      //
      // Pedirle a varios médicos a la misma hora es legítimo mientras ninguno
      // haya dicho que sí —es cómo se consigue turno—, pero una vez que hay uno
      // confirmado, el paciente ya tiene dónde estar. Reservar otro encima es
      // comprometerse a estar en dos lugares a la vez, y el que se queda
      // esperando es el médico.
      const alreadyCommitted =
        await this.bookingsRepo.findPatientBookingsOverlapping(
          tx,
          plan.patientProfileId,
          slot.startAt,
          slot.endAt ?? slot.startAt,
          ACTIVE_BOOKING_STATES,
        );
      if (alreadyCommitted.length > 0) {
        const clash = alreadyCommitted[0];
        throw new PreconditionFailedException(
          `Ya tiene una cita confirmada ese día a esa hora${
            clash.resourceName ? ` en «${clash.resourceName}»` : ''
          }. Cancélelo primero si quiere cambiarlo por éste.`,
          {
            bookingId: clash.id,
            startAt: clash.startAt,
          },
        );
      }

      // CAN-APT-001: se congela la política de cancelación vigente en el momento
      // de tomar el cupo. La referencia `booking_policy_id` puede mutar de
      // versión después, pero el snapshot preserva las condiciones que el
      // paciente aceptó.
      const policy = slot.scheduleTemplateId
        ? await this.slotPolicy.resolvePolicy(tx, slot.scheduleTemplateId)
        : null;
      // CAN-TIME-001: la tz vive en el recurso; se congela para auditoría aunque el
      // plazo se evalúe sobre instantes UTC (`start_at` es timestamptz).
      const resource = slot.resourceId
        ? await this.catalogRepo.findResourceById(tx, slot.resourceId)
        : null;

      // REGLA MADRE (AG-1): el médico es el recurso escaso, no la sede. La
      // REGLA 1 protege el tiempo del paciente; ésta protege el del profesional
      // CRUZANDO todas sus agendas — un doctor con consultorio y hospital tiene
      // dos recursos, y confirmar acá sin mirar el otro lo dejaba citado en dos
      // lugares a la vez (comprobado ejecutando, no leyendo).
      if (
        resource &&
        PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
      ) {
        await this.professionalTime.assertRangeFree(
          tx,
          resource.resourceRefId,
          slot.startAt,
          slot.endAt ?? slot.startAt,
        );
      }

      // v4.2.40 — si el cupo es de un servicio, la oferta manda: de ella salen la
      // modalidad, lo que el paciente aceptó y si la reserva espera aprobación. Se
      // lee del CUPO y no del pedido del cliente: el navegador no decide el precio.
      const ofService = slot.practitionerServiceOfferingId
        ? await this.serviceAgenda.offeringOfSlot(
            tx,
            slot.practitionerServiceOfferingId,
          )
        : null;
      const effective = ofService
        ? planForService(plan, ofService.offering.requiresApproval)
        : plan;

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
      const appointment = this.clinicalSync.createClinicalAppointment(tx, {
        tenantId: plan.tenantId,
        patientProfileId: plan.patientProfileId,
        resourceRefType: resource?.resourceRefType,
        resourceRefId: resource?.resourceRefId,
        startAt: slot.startAt,
        endAt: slot.endAt,
        reasonText: plan.reasonText,
        statusConceptId: effective.appointmentStatusConceptId,
        ...(ofService
          ? {
              typeConceptId: CLIN.ACTIVITY_PROCEDURE,
              ...(ofService.offering.channelConceptId === undefined
                ? {}
                : { channelConceptId: ofService.offering.channelConceptId }),
            }
          : {}),
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
        statusConceptId: effective.statusConceptId,
        confirmedAt: effective.confirmedAt,
        bookingPolicyId: policy?.id,
        cancellationPolicySnapshot,
        ...(ofService
          ? {
              practitionerServiceOfferingId: ofService.offering.id,
              serviceSnapshot: freezeService(ofService, slot),
            }
          : {}),
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
      const offsets = effective.reminderOffsetsMinutes;
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
        statusConceptId: effective.statusConceptId,
        remindersScheduled: offsets.length,
      };
    });
  }
}
