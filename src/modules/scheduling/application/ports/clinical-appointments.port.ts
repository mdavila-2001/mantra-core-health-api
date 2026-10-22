import type { UnitOfWork } from './unit-of-work';

/** La cita clínica que respalda una reserva (contexto `clinical`). */
export interface ClinicalAppointmentRef {
  readonly id: string;
  readonly practitionerProfileId?: string;
}

/** Lo que la reserva sabe del turno al crear su cita clínica. */
export interface NewClinicalAppointment {
  patientProfileId: string;
  tenantId: string;
  /** Profesional que atiende, cuando la agenda es de uno. */
  practitionerProfileId?: string;
  /** Estado clínico con el que nace: pendiente si se solicitó, reservada si se confirmó. */
  statusConceptId: string;
  startAt: Date;
  endAt?: Date;
  reasonText?: string;
  /** Por qué medio ocurre la atención. Ausente = presencial. */
  channelConceptId?: string;
  /** Tipología (P42: la reconsulta nace `ACT_FOLLOW_UP`). Ausente = NULL. */
  typeConceptId?: string;
  actorUserId?: string;
}

/**
 * Citas y encuentros clínicos que acompañan a una reserva (contexto `clinical`).
 *
 * Una cita clínica **es** el turno visto desde lo clínico: se crea al confirmar
 * la reserva y se mantiene al día con su estado. Los encuentros son sólo de
 * lectura para la agenda.
 */
export interface ClinicalAppointmentsPort {
  /** Crea la cita clínica dentro de la unidad de trabajo del llamador. */
  create(uow: UnitOfWork, data: NewClinicalAppointment): ClinicalAppointmentRef;

  /**
   * Mantiene la cita clínica al día con el estado de la reserva.
   * No hace nada si la cita no existe (reservas anteriores al vínculo).
   */
  updateStatus(
    uow: UnitOfWork,
    appointmentId: string,
    statusConceptId: string,
    actorUserId: string,
  ): Promise<void>;

  /** Mapa `appointmentId → tipología` de las citas que la declaran. */
  findTypesByIds(
    uow: UnitOfWork,
    appointmentIds: readonly string[],
  ): Promise<Map<string, string>>;

  /** Mapa `appointmentId → encuentro más reciente`. */
  findLatestEncounterIds(
    uow: UnitOfWork,
    appointmentIds: readonly string[],
  ): Promise<Map<string, string>>;

  /** Mapa `appointmentId → todos sus encuentros`, del más nuevo al más viejo. */
  findEncounterIds(
    uow: UnitOfWork,
    appointmentIds: readonly string[],
  ): Promise<Map<string, string[]>>;
}

/** Token de inyección de las citas clínicas. */
export const CLINICAL_APPOINTMENTS_PORT = Symbol('CLINICAL_APPOINTMENTS_PORT');
