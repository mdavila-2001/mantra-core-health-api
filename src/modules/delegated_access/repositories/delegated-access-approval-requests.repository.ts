import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DelegatedAccessApprovalRequests } from '../entities';

/** Datos para abrir una solicitud de acceso delegado. */
export interface CreateApprovalRequestData {
  practitionerDelegateAssignmentId: string;
  requestedPermissionId: string;
  patientProfileId?: string;
  encounterId?: string;
  reasonText?: string;
  decisionConceptId: string;
  statusConceptId: string;
}

/** Acceso a datos de `delegated_access.delegated_access_approval_requests`. */
@Injectable()
export class DelegatedAccessApprovalRequestsRepository {
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
