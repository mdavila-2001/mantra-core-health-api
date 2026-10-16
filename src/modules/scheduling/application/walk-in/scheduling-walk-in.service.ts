import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { type AuthenticatedUser } from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import {
  CLINICAL_ENCOUNTERS_PORT,
  type ClinicalEncountersPort,
} from '../ports/clinical-encounters.port';
import {
  WALK_IN_PATIENT_REGISTRY_PORT,
  type WalkInPatientRegistryPort,
} from '../ports/walk-in-patient-registry.port';
import {
  WalkInAppointmentDto,
  WalkInAppointmentResponseDto,
} from '../../presentation/dto';
import { SchedulingBookingsService } from '../bookings/scheduling-bookings.service';

/**
 * El turno de mostrador atómico (AC-3.3): registra al paciente sin cuenta de
 * portal, reserva la cita y abre el encuentro clínico en una sola
 * transacción.
 *
 * Cruza tres módulos —`profiles`/`common` para la filiación, `scheduling`
 * para la reserva, `clinical` para el encuentro— igual que hace
 * `IamPatientSelfRegistrationService`, y por la misma razón: una reserva sin
 * paciente o un encuentro sin reserva no sirven para nada, y dejarlos a
 * medias obligaría a un flujo de reparación manual en el mostrador.
 *
 * La reserva nace `IN_PROGRESS`, no `CONFIRMED`: el DoD pide un `encounterId`
 * listo para registrar la atención, no una cita pendiente de check-in — quien
 * llega al mostrador ya está ahí.
 */
@Injectable()
export class SchedulingWalkInService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param bookingsService - Reutiliza el cuerpo transaccional de la cita
   *   directa y el paso final de `start`.
   * @param encounters - Abre el encuentro y, si hay profesional, su
   *   participante, en la misma transacción.
   * @param patientRegistry - Alta de la persona, su perfil, documento,
   *   teléfono y tutor del paciente de mostrador.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsService: SchedulingBookingsService,
    @Inject(CLINICAL_ENCOUNTERS_PORT)
    private readonly encounters: ClinicalEncountersPort,
    @Inject(WALK_IN_PATIENT_REGISTRY_PORT)
    private readonly patientRegistry: WalkInPatientRegistryPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingWalkInService.name);
  }

  /**
   * Alta del paciente + cita directa + encuentro + inicio, en una sola
   * transacción.
   *
   * @param dto - Filiación del paciente y datos de la cita.
   * @param actor - Quien atiende el mostrador.
   * @returns Los ids de lo creado y el estado con el que nace la reserva.
   */
  async createWalkInAppointment(
    dto: WalkInAppointmentDto,
    actor: AuthenticatedUser,
  ): Promise<WalkInAppointmentResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.appointment.walk-in',
        resourceId: dto.resourceId,
      },
      'Creating walk-in appointment',
    );

    return this.em.transactional(async (tx) => {
      const patient = await this.patientRegistry.register(tx, {
        ...dto.patient,
        actorUserId: actor.id,
      });

      const { booking, slot, appointment, retractedSlots } =
        await this.bookingsService.createDirectAppointmentInTransaction(
          tx,
          {
            patientProfileId: patient.patientProfileId,
            resourceId: dto.resourceId,
            startAt: dto.startAt,
            durationMinutes: dto.durationMinutes,
            reasonText: dto.reasonText,
            channel: dto.channel,
          },
          actor,
          { bookingChannel: 'WALK_IN' },
        );

      // El encuentro nace abierto: quien llegó al mostrador ya está siendo
      // atendido, no esperando un check-in posterior.
      const encounter = this.encounters.open(tx, {
        patientProfileId: patient.patientProfileId,
        tenantId: booking.tenantId,
        primaryPractitionerId: appointment.practitionerProfileId,
        classConceptId: CLIN.ENCOUNTER_CLASS_AMBULATORY,
        statusConceptId: CLIN.ENCOUNTER_IN_PROGRESS,
        reasonText: dto.reasonText,
        appointmentId: appointment.id,
        startAt: new Date(),
        actorUserId: actor.id,
      });
      // FK plana: el participante exige que el encuentro ya exista.
      await tx.flush();

      if (appointment.practitionerProfileId) {
        this.encounters.addParticipant(tx, {
          encounterId: encounter.id,
          practitionerProfileId: appointment.practitionerProfileId,
          participantRoleConceptId: CLIN.PARTICIPANT_ROLE_ATTENDER,
          statusConceptId: CLIN.PARTICIPANT_ACTIVE,
          isResponsible: true,
          periodStart: encounter.startAt,
          actorUserId: actor.id,
        });
      }

      await this.bookingsService.startInTransaction(tx, booking, actor);

      return {
        patientProfileId: patient.patientProfileId,
        personId: patient.personId,
        patientCode: patient.patientCode,
        bookingId: booking.id,
        bookableSlotId: slot.id,
        appointmentId: appointment.id,
        encounterId: encounter.id,
        statusConceptId: booking.statusConceptId,
        retractedSlots,
      };
    });
  }
}
