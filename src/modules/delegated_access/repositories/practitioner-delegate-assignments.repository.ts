import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerDelegateAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una delegación de practitioner. */
export interface CreateDelegateData {
  practitionerRoleAssignmentId: string;
  delegateUserAssignmentId: string;
  delegatedPermissionSetId: string;
  delegateRoleConceptId: string;
  patientScopeConceptId?: string;
  appointmentScopeConceptId?: string;
  mayViewClinicalContent?: boolean;
  mayEditDrafts?: boolean;
  maySignClinicalContent?: boolean;
  validFrom?: Date;
  validTo?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `delegated_access.practitioner_delegate_assignments`. */
@Injectable()
export class PractitionerDelegateAssignmentsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerDelegateAssignments | null> {
    return em.findOne(PractitionerDelegateAssignments, { id });
  }

  create(
    em: EntityManager,
    data: CreateDelegateData,
  ): PractitionerDelegateAssignments {
    return em.create(
      PractitionerDelegateAssignments,
      {
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        delegateUserAssignmentId: data.delegateUserAssignmentId,
        delegatedPermissionSetId: data.delegatedPermissionSetId,
        delegateRoleConceptId: data.delegateRoleConceptId,
        patientScopeConceptId: data.patientScopeConceptId,
        appointmentScopeConceptId: data.appointmentScopeConceptId,
        mayViewClinicalContent: data.mayViewClinicalContent ?? false,
        mayEditDrafts: data.mayEditDrafts ?? false,
        maySignClinicalContent: data.maySignClinicalContent ?? false,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Delegaciones ACTIVAS dependientes de una asignación org (cascada de suspensión). */
  suspendByDelegateAssignment(
    em: EntityManager,
    delegateUserAssignmentId: string,
    activeStatusConceptId: string,
    suspendedStatusConceptId: string,
    now: Date,
    actorUserId?: string,
  ): Promise<number> {
    return em.nativeUpdate(
      PractitionerDelegateAssignments,
      { delegateUserAssignmentId, statusConceptId: activeStatusConceptId },
      {
        statusConceptId: suspendedStatusConceptId,
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    );
  }

  /** Delegaciones ACTIVAS ya vencidas (barrido de expiración). */
  findOverdueActive(
    em: EntityManager,
    now: Date,
    activeStatusConceptId: string,
  ): Promise<PractitionerDelegateAssignments[]> {
    return em.find(PractitionerDelegateAssignments, {
      statusConceptId: activeStatusConceptId,
      validTo: { $ne: null, $lt: now },
    });
  }
}
