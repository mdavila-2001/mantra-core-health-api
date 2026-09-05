import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Appointments } from '../entities';

/** Datos para registrar una cita clínica. */
export interface CreateAppointmentData {
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Profesional que atiende, cuando la agenda es de uno.
   */
  practitionerProfileId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Cuándo empieza la atención.
   */
  startAt: Date;
  /**
   * Cuándo termina, si el cupo lo declara.
   */
  endAt?: Date;
  /**
   * Motivo de consulta, en palabras.
   */
  reasonText?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `clinical.appointments`.
 *
 * ## Por qué no existía
 *
 * Porque **nadie escribía la tabla**: 0 filas, y ninguna reserva de agenda con
 * `appointment_id`. La columna estaba en el modelo y el contrato la pedía —el
 * check-in de un encuentro declara `appointmentId` hacia acá— pero no había
 * forma de llenarla, así que un encuentro nunca podía decir de qué turno venía.
 *
 * Lo escribe la confirmación de una reserva: una cita **es** el turno visto
 * desde lo clínico. Ver `SchedulingBookingsService.crearCitaClinica` para por
 * qué nace ahí y no en el check-in.
 */
@Injectable()
export class AppointmentsRepository {
  /**
   * Registra una cita clínica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos de la cita.
   * @returns La cita creada, sin persistir todavía.
   */
  create(em: EntityManager, data: CreateAppointmentData): Appointments {
    const ahora = new Date();
    return em.create(
      Appointments,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        practitionerProfileId: data.practitionerProfileId,
        statusConceptId: data.statusConceptId,
        startAt: data.startAt,
        endAt: data.endAt,
        reasonText: data.reasonText,
        createdAt: ahora,
        updatedAt: ahora,
        createdByUserId: data.actorUserId,
        updatedByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la cita.
   * @returns La cita, o `null` si no existe.
   */
  findById(em: EntityManager, id: string): Promise<Appointments | null> {
    return em.findOne(Appointments, { id });
  }

  /**
   * Comprueba si existe (o existió) un turno entre este profesional y este
   * paciente, en cualquier estado.
   *
   * La usa {@link ClinicalRecordAccessGuard} como base legítima de acceso al
   * expediente: quien atendió (o tiene programado atender) a una persona puede
   * abrir su historia por el identificador que trae su propia agenda, sin
   * necesitar además un `care_relationship`/`clinical_access_grant` explícito
   * para ese mismo vínculo. No sustituye esas dos vías — es una tercera, más
   * barata de comprobar y ya presente en el dominio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practitionerProfileId - Profesional que pide ver el expediente.
   * @param patientProfileId - Paciente cuyo expediente se pide.
   * @returns `true` si existe al menos una cita entre ambos.
   */
  async existsForPractitionerAndPatient(
    em: EntityManager,
    practitionerProfileId: string,
    patientProfileId: string,
  ): Promise<boolean> {
    const count = await em.count(Appointments, {
      practitionerProfileId,
      patientProfileId,
    });
    return count > 0;
  }
}
