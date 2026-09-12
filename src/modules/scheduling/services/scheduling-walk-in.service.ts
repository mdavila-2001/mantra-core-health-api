import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';

import { type AuthenticatedUser } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { EncountersRepository } from '../../clinical/repositories';
import {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import {
  PatientProfilesRepository,
  PersonProfilesRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../../profiles/repositories';
import { WalkInAppointmentDto, WalkInAppointmentResponseDto } from '../dto';
import { SchedulingBookingsService } from './scheduling-bookings.service';
import { createWalkInPatient } from './walk-in-patient';

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
   * @param encountersRepo - Abre el encuentro y, si hay profesional, su
   *   participante, en la misma transacción.
   * @param personsRepo - Alta de la persona del paciente de mostrador.
   * @param personProfilesRepo - Alta de su perfil de paciente.
   * @param patientProfilesRepo - Alta de `patient_profiles`.
   * @param identifiersRepo - Documento oficial y comprobación de duplicados.
   * @param contactPointsRepo - Teléfono de contacto.
   * @param relatedPersonsRepo - Tutor o persona autorizada, si lo declaró.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsService: SchedulingBookingsService,
    private readonly encountersRepo: EncountersRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly relatedPersonsRepo: RelatedPersonsRepository,
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
      const paciente = await createWalkInPatient(
        {
          persons: this.personsRepo,
          personProfiles: this.personProfilesRepo,
          patientProfiles: this.patientProfilesRepo,
          identifiers: this.identifiersRepo,
          contactPoints: this.contactPointsRepo,
          relatedPersons: this.relatedPersonsRepo,
        },
        tx,
        { ...dto.patient, actorUserId: actor.id },
      );

      const { booking, slot, appointment, retractedSlots } =
        await this.bookingsService.crearCitaDirectaEnTransaccion(
          tx,
          {
            patientProfileId: paciente.patientProfileId,
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
      const encounter = this.encountersRepo.create(tx, {
        patientProfileId: paciente.patientProfileId,
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
        this.encountersRepo.createParticipant(tx, {
          encounterId: encounter.id,
          practitionerProfileId: appointment.practitionerProfileId,
          participantRoleConceptId: CLIN.PARTICIPANT_ROLE_ATTENDER,
          statusConceptId: CLIN.PARTICIPANT_ACTIVE,
          isResponsible: true,
          periodStart: encounter.startAt,
          actorUserId: actor.id,
        });
      }

      await this.bookingsService.iniciarEnTransaccion(tx, booking, actor);

      return {
        patientProfileId: paciente.patientProfileId,
        personId: paciente.personId,
        patientCode: paciente.patientCode,
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
