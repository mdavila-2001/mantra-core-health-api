import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserRoleAssignments } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de asignación de un rol a un usuario con vigencia y ámbito. */
export interface CreateRoleAssignmentData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a role.
   */
  roleId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a branch.
   */
  branchId?: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a assigned by user.
   */
  assignedByUserId?: string;
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

/** Acceso a datos de `authz.user_role_assignments`. */
@Injectable()
export class UserRoleAssignmentsRepository {
  /** Asignación activa concreta (user, role) si existe (evita solapes). */
  findActive(
    em: EntityManager,
    userId: string,
    roleId: string,
  ): Promise<UserRoleAssignments | null> {
    return em.findOne(UserRoleAssignments, {
      userId,
      roleId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Asignaciones activas del usuario (para resolver roles efectivos en el PDP). */
  findActiveForUser(
    em: EntityManager,
    userId: string,
  ): Promise<UserRoleAssignments[]> {
    return em.find(UserRoleAssignments, {
      userId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `UserRoleAssignments`.
   */
  create(
    em: EntityManager,
    data: CreateRoleAssignmentData,
  ): UserRoleAssignments {
    return em.create(
      UserRoleAssignments,
      {
        userId: data.userId,
        roleId: data.roleId,
        tenantId: data.tenantId,
        branchId: data.branchId,
        practiceId: data.practiceId,
        assignedByUserId: data.assignedByUserId,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
