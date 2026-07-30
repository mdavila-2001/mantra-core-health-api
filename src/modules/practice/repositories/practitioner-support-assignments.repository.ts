import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PractitionerSupportAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para adjuntar personal de apoyo a un rol de profesional. */
export interface CreateSupportAssignmentData {
  /**
   * Identificador asociado a practitioner role assignment.
   */
  practitionerRoleAssignmentId: string;
  /**
   * Identificador asociado a support profile.
   */
  supportProfileId: string;
  /**
   * Identificador asociado a support role concept.
   */
  supportRoleConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a scope concept.
   */
  scopeConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.practitioner_support_assignments` (stateless). */
@Injectable()
export class PractitionerSupportAssignmentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PractitionerSupportAssignments | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerSupportAssignments | null> {
    return em.findOne(PractitionerSupportAssignments, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PractitionerSupportAssignments`.
   */
  create(
    em: EntityManager,
    data: CreateSupportAssignmentData,
  ): PractitionerSupportAssignments {
    return em.create(
      PractitionerSupportAssignments,
      {
        practitionerRoleAssignmentId: data.practitionerRoleAssignmentId,
        supportProfileId: data.supportProfileId,
        supportRoleConceptId: data.supportRoleConceptId,
        scopeConceptId: data.scopeConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
