import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SurveyInvitations } from '../entities';
import { createdBy } from '../../../common';
import { PRACTITIONER_PROFILE_TABLES } from '../../scheduling/domain/resource/practitioner-profile-tables';

/** Alta de una invitación a responder. */
export interface CreateInvitationData {
  /**
   * Identificador asociado a survey version: la base del sistema, o la del
   * profesional en una invitación suelta.
   */
  surveyVersionId: string;
  /**
   * Versión del profesional que viaja detrás de la base, si la hay.
   */
  extensionSurveyVersionId?: string;
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

/** Lo que la bandeja del paciente muestra de una invitación además de sus columnas. */
export interface InvitationCardContext {
  /** Invitación a la que corresponde. */
  invitationId: string;
  /** Título de la plantilla de la versión principal. */
  title: string;
  /** Consigna de la plantilla. */
  description: string | null;
  /** `SERVICE` si la reserva es de un servicio ofrecido; `CONSULTATION` si no. */
  kind: 'CONSULTATION' | 'SERVICE';
  /** Nombre del servicio reservado; `null` en una consulta. */
  serviceName: string | null;
  /** Nombre visible de quien atendió; `null` si no se puede determinar. */
  practitionerDisplayName: string | null;
  /** Fecha y hora de la atención (inicio del cupo reservado), ISO 8601. */
  attendedAt: string | null;
}

/** Fila cruda de la consulta de {@link InvitationsRepository.listCardContext}. */
interface InvitationCardContextRow {
  invitationId: string;
  title: string;
  description: string | null;
  isService: boolean;
  serviceName: string | null;
  practitionerDisplayName: string | null;
  attendedAt: Date | string | null;
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
   * Obtiene la invitación bloqueándola hasta el fin de la transacción.
   *
   * Serializa dos envíos simultáneos de la misma invitación: el segundo espera,
   * ve la invitación ya respondida y recibe el conflicto en lugar de duplicar la
   * respuesta.
   *
   * @param em - Transacción activa.
   * @param id - Identificador de la invitación.
   * @returns Resultado conforme al contrato `Promise<SurveyInvitations | null>`.
   */
  findByIdForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<SurveyInvitations | null> {
    return em.findOne(
      SurveyInvitations,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Lista las invitaciones de un paciente **en un tenant**, más recientes primero.
   *
   * El perfil de paciente es global (no lleva `tenant_id`): la igualdad del
   * perfil no prueba que la invitación pertenezca a la organización activa, así
   * que el tenant es parte obligatoria del criterio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador del perfil de paciente.
   * @param tenantId - Tenant activo de la petición.
   * @returns Resultado conforme al contrato `Promise<SurveyInvitations[]>`.
   */
  listByPatient(
    em: EntityManager,
    patientProfileId: string,
    tenantId: string,
  ): Promise<SurveyInvitations[]> {
    return em.find(
      SurveyInvitations,
      { patientProfileId, tenantId },
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
   * Lista las invitaciones que llevan alguna de estas versiones como extensión
   * del profesional (detrás de la base del sistema).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param surveyVersionIds - Identificadores de versión del profesional.
   * @returns Resultado conforme al contrato `Promise<SurveyInvitations[]>`.
   */
  listByExtensionVersions(
    em: EntityManager,
    surveyVersionIds: string[],
  ): Promise<SurveyInvitations[]> {
    if (surveyVersionIds.length === 0) return Promise.resolve([]);
    return em.find(SurveyInvitations, {
      extensionSurveyVersionId: { $in: surveyVersionIds },
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

  /**
   * El contexto de cada invitación para la bandeja del paciente: título de la
   * plantilla y, de la reserva que la originó, el tipo de atención, el servicio,
   * quién atendió y cuándo.
   *
   * **Una sola consulta agregada por lista** (la cantidad de consultas no
   * depende de cuántas invitaciones haya). Los `LEFT JOIN` hacen que una reserva
   * que ya no se pueda resolver degrade a campos `null` en vez de ocultar la
   * invitación. Una invitación sin plantilla no aparece (la lista la omite).
   *
   * El profesional es el dueño de la oferta si la reserva es de un servicio y,
   * si no, el del recurso reservado (el de la reserva o el del cupo), igual que
   * al decidir a quién evalúa la encuesta.
   *
   * @param em - Contexto de persistencia.
   * @param invitationIds - Invitaciones ya acotadas a paciente y tenant.
   * @returns El contexto por identificador de invitación.
   */
  async listCardContext(
    em: EntityManager,
    invitationIds: readonly string[],
  ): Promise<Map<string, InvitationCardContext>> {
    const result = new Map<string, InvitationCardContext>();
    if (invitationIds.length === 0) return result;
    const rows = await em.getConnection().execute<InvitationCardContextRow[]>(
      `SELECT i.id AS "invitationId",
                t.title AS "title",
                t.description AS "description",
                (b.practitioner_service_offering_id IS NOT NULL) AS "isService",
                CASE WHEN b.practitioner_service_offering_id IS NOT NULL
                     THEN COALESCE(sc.name, b.service_snapshot ->> 'serviceName')
                END AS "serviceName",
                pe.display_name AS "practitionerDisplayName",
                s.start_at AS "attendedAt"
           FROM surveys.survey_invitations i
           JOIN surveys.survey_versions v ON v.id = i.survey_version_id
           JOIN surveys.survey_templates t ON t.id = v.survey_template_id
           LEFT JOIN scheduling.appointment_bookings b
                  ON b.id = i.appointment_booking_id
           LEFT JOIN scheduling.bookable_slots s ON s.id = b.bookable_slot_id
           LEFT JOIN scheduling.practitioner_service_offerings po
                  ON po.id = b.practitioner_service_offering_id
           LEFT JOIN billing.service_catalog sc ON sc.id = po.service_catalog_id
           LEFT JOIN scheduling.schedulable_resources r
                  ON r.id = COALESCE(b.resource_id, s.resource_id)
                 AND r.resource_ref_type IN (?, ?)
           LEFT JOIN profiles.persons pe
                  ON pe.id = COALESCE(po.practitioner_profile_id, r.resource_ref_id)
          WHERE i.id IN (${invitationIds.map(() => '?').join(', ')})`,
      [...PRACTITIONER_PROFILE_TABLES, ...invitationIds],
    );
    for (const row of rows) {
      result.set(row.invitationId, {
        invitationId: row.invitationId,
        title: row.title,
        description: row.description,
        kind: row.isService ? 'SERVICE' : 'CONSULTATION',
        serviceName: row.serviceName,
        practitionerDisplayName: row.practitionerDisplayName,
        attendedAt:
          row.attendedAt === null
            ? null
            : new Date(row.attendedAt).toISOString(),
      });
    }
    return result;
  }
}
