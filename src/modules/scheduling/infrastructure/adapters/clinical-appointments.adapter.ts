import { Injectable } from '@nestjs/common';
import { touch } from '../../../../common';
import {
  AppointmentsRepository,
  EncountersRepository,
} from '../../../clinical/repositories';
import type {
  ClinicalAppointmentRef,
  ClinicalAppointmentsPort,
  MovedClinicalAppointment,
  NewClinicalAppointment,
} from '../../application/ports/clinical-appointments.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/** Implementa las citas clínicas sobre los repositorios de `clinical`. */
@Injectable()
export class ClinicalAppointmentsAdapter implements ClinicalAppointmentsPort {
  constructor(
    private readonly appointments: AppointmentsRepository,
    private readonly encounters: EncountersRepository,
  ) {}

  create(
    uow: UnitOfWork,
    data: NewClinicalAppointment,
  ): ClinicalAppointmentRef {
    return this.appointments.create(uow, data);
  }

  async updateStatus(
    uow: UnitOfWork,
    appointmentId: string,
    statusConceptId: string,
    actorUserId: string,
  ): Promise<void> {
    const appointment = await this.appointments.findById(uow, appointmentId);
    if (!appointment) {
      return;
    }
    appointment.statusConceptId = statusConceptId;
    touch(appointment, actorUserId);
  }

  async move(
    uow: UnitOfWork,
    appointmentId: string,
    data: MovedClinicalAppointment,
  ): Promise<void> {
    const appointment = await this.appointments.findById(uow, appointmentId);
    if (!appointment) {
      return;
    }
    appointment.startAt = data.startAt;
    appointment.endAt = data.endAt;
    // Columna anulable: soltar el espacio es escribir NULL.
    (appointment as { careSpaceId?: string | null }).careSpaceId =
      data.careSpaceId;
    if (data.practitionerProfileId !== undefined) {
      appointment.practitionerProfileId = data.practitionerProfileId;
    }
    touch(appointment, data.actorUserId);
  }

  findTypesByIds(
    uow: UnitOfWork,
    appointmentIds: readonly string[],
  ): Promise<Map<string, string>> {
    return this.appointments.findTypesByIds(uow, appointmentIds);
  }

  findLatestEncounterIds(
    uow: UnitOfWork,
    appointmentIds: readonly string[],
  ): Promise<Map<string, string>> {
    return this.encounters.findLatestIdsByAppointmentIds(uow, appointmentIds);
  }

  findEncounterIds(
    uow: UnitOfWork,
    appointmentIds: readonly string[],
  ): Promise<Map<string, string[]>> {
    return this.encounters.findIdsByAppointmentIds(uow, appointmentIds);
  }
}
