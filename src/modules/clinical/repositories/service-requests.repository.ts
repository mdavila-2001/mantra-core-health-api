import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ServiceRequests } from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create service request data.
 */
export interface CreateServiceRequestData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * P43: instancia de formulario de origen (ya validada por el servicio).
   */
  formInstanceId?: string;
  /**
   * Identificador asociado a code concept.
   */
  codeConceptId: string;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Identificador asociado a intent concept.
   */
  intentConceptId?: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a requester profile.
   */
  requesterProfileId?: string;
  /**
   * Identificador asociado a performer tenant.
   */
  performerTenantId?: string;
  /**
   * Modo de ejecutor recomendado (concepto del conjunto `service-request-performer-selection`).
   */
  performerSelectionConceptId?: string;
  /**
   * Médico ejecutor («lo hago yo»).
   */
  performerPractitionerProfileId?: string;
  /**
   * Sede sugerida. Es una recomendación: no concede acceso a la orden.
   */
  suggestedPracticeSiteId?: string;
  /** F5b: punto de toma sugerido. */
  suggestedCareSpaceId?: string;
  /**
   * El informe diagnóstico previo que satisface este pedido, si el motor de
   * duplicidad encontró uno y el médico decidió (antiduplicación, v4.2.17).
   */
  previousDiagnosticReportId?: string;
  /**
   * Justificación clínica para repetir un estudio duplicado. `undefined`
   * cuando la orden reutiliza el informe previo o no hubo duplicado.
   */
  duplicateOverrideReason?: string;
  /** Agrupa los renglones pedidos juntos (`POST /clinical/requisitions`). */
  requisitionId?: string;
  /** Muestra pedida (sólo laboratorio/patología). */
  specimenTypeConceptId?: string;
  /** Modalidad de imagen. */
  modalityConceptId?: string;
  /** Región corporal (`imaging-body-structure`). */
  bodySiteConceptId?: string;
  /** Lateralidad (`condition-laterality`). */
  lateralityConceptId?: string;
  /** Contraste (`imaging-contrast`). */
  contrastConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical.service_requests` (stateless). */
@Injectable()
export class ServiceRequestsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ServiceRequests | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ServiceRequests | null> {
    return em.findOne(ServiceRequests, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ServiceRequests`.
   */
  create(em: EntityManager, data: CreateServiceRequestData): ServiceRequests {
    return em.create(
      ServiceRequests,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        formInstanceId: data.formInstanceId,
        codeConceptId: data.codeConceptId,
        categoryConceptId: data.categoryConceptId,
        intentConceptId: data.intentConceptId,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        requesterProfileId: data.requesterProfileId,
        performerTenantId: data.performerTenantId,
        performerSelectionConceptId: data.performerSelectionConceptId,
        performerPractitionerProfileId: data.performerPractitionerProfileId,
        suggestedPracticeSiteId: data.suggestedPracticeSiteId,
        ...(data.suggestedCareSpaceId
          ? { suggestedCareSpaceId: data.suggestedCareSpaceId }
          : {}),
        previousDiagnosticReportId: data.previousDiagnosticReportId,
        duplicateOverrideReason: data.duplicateOverrideReason,
        requisitionId: data.requisitionId,
        specimenTypeConceptId: data.specimenTypeConceptId,
        modalityConceptId: data.modalityConceptId,
        bodySiteConceptId: data.bodySiteConceptId,
        lateralityConceptId: data.lateralityConceptId,
        contrastConceptId: data.contrastConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
