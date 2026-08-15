import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SurveyInvitations } from '../entities';
import { createdBy } from '../../../common';

/** Alta de una invitación a responder. */
export interface CreateInvitationData {
  /**
   * Identificador asociado a survey version.
   */
  surveyVersionId: string;
  /**
   * Identificador asociado a survey assignment.
   */
  surveyAssignmentId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a appointment booking.
   */
  appointmentBookingId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de issued at mantenido por la instancia.
   */
  issuedAt: Date;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `surveys.survey_invitations`. */
@Injectable()
export class InvitationsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de la invitación.
   * @returns Resultado conforme al contrato `Promise<SurveyInvitations | null>`.
   */
  findById(em: EntityManager, id: string): Promise<SurveyInvitations | null> {
    return em.findOne(SurveyInvitations, { id });
  }

  /**
   * Lista las invitaciones de un paciente, más recientes primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del perfil de paciente.
   * @returns Resultado conforme al contrato `Promise<SurveyInvitations[]>`.
   */
  listByPatient(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<SurveyInvitations[]> {
    return em.find(
      SurveyInvitations,
      { patientProfileId },
      { orderBy: { issuedAt: 'desc' } },
    );
  }

  /**
   * Lista las invitaciones emitidas para una reserva concreta.
   *
   * Es lo que hace idempotente la emisión: cerrar dos veces la misma cita no
   * puede reclamarle al paciente dos veces el mismo cuestionario.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param appointmentBookingId - Identificador de la reserva.
   * @returns Resultado conforme al contrato `Promise<SurveyInvitations[]>`.
   */
  listByBooking(
    em: EntityManager,
    appointmentBookingId: string,
  ): Promise<SurveyInvitations[]> {
    return em.find(SurveyInvitations, { appointmentBookingId });
  }

  /**
   * Lista las invitaciones emitidas para las versiones indicadas.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyVersionIds - Identificadores de versión.
   * @returns Resultado conforme al contrato `Promise<SurveyInvitations[]>`.
   */
  listByVersions(
    em: EntityManager,
    surveyVersionIds: string[],
  ): Promise<SurveyInvitations[]> {
    if (surveyVersionIds.length === 0) return Promise.resolve([]);
    return em.find(SurveyInvitations, {
      surveyVersionId: { $in: surveyVersionIds },
    });
  }

  /**
   * Crea la invitación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del alta.
   * @returns Resultado conforme al contrato `SurveyInvitations`.
   */
  create(em: EntityManager, data: CreateInvitationData): SurveyInvitations {
    const { actorUserId, ...rest } = data;
    return em.create(
      SurveyInvitations,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }
}
