import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { UserRoleAssignments } from '../entities';
import { CONCEPTS, createdBy, touch } from '../../../common';

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
  /**
   * Asignación activa concreta para un ámbito exacto (MCH-034).
   *
   * `(userId, roleId)` no identifica una asignación: el mismo rol puede
   * concederse por separado en distintos tenants/sedes/consultorios. La clave
   * es la tupla completa, y un ámbito no declarado es parte de esa clave —
   * `tenantId` ausente busca una asignación **global** (columna en `NULL`),
   * nunca "cualquier tenant". Por eso cada campo se normaliza a `null` en vez
   * de dejarlo en `undefined`: MikroORM omite del `WHERE` una clave en
   * `undefined`, que es justo el bug que esto corrige.
   *
   * @param scope - Ámbito exacto a buscar; cada campo ausente es `NULL`.
   */
  findActive(
    em: EntityManager,
    userId: string,
    roleId: string,
    scope: {
      tenantId?: string | null;
      branchId?: string | null;
      practiceId?: string | null;
    } = {},
  ): Promise<UserRoleAssignments | null> {
    return em.findOne(UserRoleAssignments, {
      userId,
      roleId,
      tenantId: scope.tenantId ?? null,
      branchId: scope.branchId ?? null,
      practiceId: scope.practiceId ?? null,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /**
   * Asignaciones vigentes del usuario (para resolver roles efectivos en el PDP
   * y para construir el claim `roles` del token).
   *
   * El estado activo no basta: `valid_from`/`valid_to` son la ventana con la que
   * un administrador concede un rol temporal —una guardia, una suplencia— y
   * filtrarla sólo por estado hacía que ese rol siguiera concediendo acceso
   * indefinidamente, porque nada cambia el estado al vencer la fecha.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Usuario del que se resuelven las asignaciones.
   * @param now - Instante de referencia; por defecto, el actual.
   * @returns Las asignaciones activas cuya vigencia cubre `now`.
   */
  findActiveForUser(
    em: EntityManager,
    userId: string,
    now: Date = new Date(),
  ): Promise<UserRoleAssignments[]> {
    return em.find(UserRoleAssignments, {
      userId,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: null }, { validTo: { $gt: now } }] },
      ],
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

  /**
   * Corta la vigencia de una asignación ya concedida (AG-31, BR-26).
   *
   * No borra la fila —es evidencia de que el acceso existió y por cuánto—:
   * pone `valid_to` en `at` (por defecto ahora), que es exactamente lo que
   * {@link findActiveForUser} ya usa para decidir si una asignación sigue
   * vigente. No toca `status_concept_id`: una asignación con `valid_to`
   * vencido y `STATE_ACTIVE` sigue siendo «una asignación que existió y ya no
   * aplica», el mismo criterio que una guardia con fecha de fin.
   *
   * Idempotente: revocar una asignación ya vencida no le acorta más la
   * vigencia.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignment - La asignación a cerrar.
   * @param actorUserId - Quién la revoca.
   * @param at - Instante de corte; por defecto, ahora.
   */
  revoke(
    em: EntityManager,
    assignment: UserRoleAssignments,
    actorUserId: string,
    at: Date = new Date(),
  ): void {
    if (assignment.validTo && assignment.validTo <= at) return;
    assignment.validTo = at;
    touch(assignment, actorUserId);
  }
}
