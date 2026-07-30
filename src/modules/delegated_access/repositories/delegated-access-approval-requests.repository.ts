import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegatedAccessApprovalRequests } from '../entities';

/** Datos para abrir una solicitud de acceso delegado. */
export interface CreateApprovalRequestData {
  /**
   * Identificador asociado a practitioner delegate assignment.
   */
  practitionerDelegateAssignmentId: string;
  /**
   * Identificador asociado a requested permission.
   */
  requestedPermissionId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText?: string;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
}

/** Acceso a datos de `delegated_access.delegated_access_approval_requests`. */
@Injectable()
export class DelegatedAccessApprovalRequestsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<DelegatedAccessApprovalRequests | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<DelegatedAccessApprovalRequests | null> {
    return em.findOne(DelegatedAccessApprovalRequests, { id });
  }

  /** Solicitud OPEN duplicada por (asignación, permiso, paciente/encuentro). */
  findOpenDuplicate(
    em: EntityManager,
    openStatusConceptId: string,
    practitionerDelegateAssignmentId: string,
    requestedPermissionId: string,
    patientProfileId?: string,
    encounterId?: string,
  ): Promise<DelegatedAccessApprovalRequests | null> {
    return em.findOne(DelegatedAccessApprovalRequests, {
      statusConceptId: openStatusConceptId,
      practitionerDelegateAssignmentId,
      requestedPermissionId,
      patientProfileId: patientProfileId ?? null,
      encounterId: encounterId ?? null,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `DelegatedAccessApprovalRequests`.
   */
  create(
    em: EntityManager,
    data: CreateApprovalRequestData,
  ): DelegatedAccessApprovalRequests {
    return em.create(
      DelegatedAccessApprovalRequests,
      {
        practitionerDelegateAssignmentId: data.practitionerDelegateAssignmentId,
        requestedPermissionId: data.requestedPermissionId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        reasonText: data.reasonText,
        requestedAt: new Date(),
        decisionConceptId: data.decisionConceptId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Cancela en bloque las solicitudes OPEN de una delegación (al revocar). */
  cancelOpenByAssignment(
    em: EntityManager,
    practitionerDelegateAssignmentId: string,
    openStatusConceptId: string,
    cancelledStatusConceptId: string,
  ): Promise<number> {
    return em.nativeUpdate(
      DelegatedAccessApprovalRequests,
      {
        practitionerDelegateAssignmentId,
        statusConceptId: openStatusConceptId,
      },
      { statusConceptId: cancelledStatusConceptId },
    );
  }
}
