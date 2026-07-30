import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerDelegateAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una delegación de practitioner. */
export interface CreateDelegateData {
  /**
   * Identificador asociado a practitioner role assignment.
   */
  practitionerRoleAssignmentId: string;
  /**
   * Identificador asociado a delegate user assignment.
   */
  delegateUserAssignmentId: string;
  /**
   * Identificador asociado a delegated permission set.
   */
  delegatedPermissionSetId: string;
  /**
   * Identificador asociado a delegate role concept.
   */
  delegateRoleConceptId: string;
  /**
   * Identificador asociado a patient scope concept.
   */
  patientScopeConceptId?: string;
  /**
   * Identificador asociado a appointment scope concept.
   */
  appointmentScopeConceptId?: string;
  /**
   * Valor de may view clinical content mantenido por la instancia.
   */
  mayViewClinicalContent?: boolean;
  /**
   * Valor de may edit drafts mantenido por la instancia.
   */
  mayEditDrafts?: boolean;
  /**
   * Valor de may sign clinical content mantenido por la instancia.
   */
  maySignClinicalContent?: boolean;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `delegated_access.practitioner_delegate_assignments`. */
@Injectable()
export class PractitionerDelegateAssignmentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PractitionerDelegateAssignments | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerDelegateAssignments | null> {
    return em.findOne(PractitionerDelegateAssignments, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PractitionerDelegateAssignments`.
   */
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
