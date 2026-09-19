import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { Roles } from '../entities';
import { UserRoleAssignmentsRepository } from '../repositories';

/**
 * Resuelve los códigos de rol vigentes de un usuario a partir de
 * `authz.user_role_assignments`.
 *
 * Existe para cerrar la brecha entre los dos sistemas de roles que convivían sin
 * tocarse: `RolesGuard` sólo lee el claim `roles` del token, que se construía
 * únicamente con `iam.user_global_roles` (cuatro códigos posibles), mientras que
 * los roles de negocio —los diez actores clínicos incluidos— viven en `authz`
 * con tenant, vigencia y estado. El resultado era que ningún sujeto distinto de
 * `SUPERADMIN` podía atravesar un `@Roles('SURGEON')`.
 *
 * Lo consume `iam` al emitir y al refrescar el token. Se expone como servicio de
 * `authz` —y no como una lectura directa de sus tablas desde `iam`— para que la
 * autoridad sobre qué rol está vigente siga siendo de un solo módulo.
 */
@Injectable()
export class AuthzEffectiveRolesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param assignmentsRepo - Acceso a `authz.user_role_assignments`.
   */
  constructor(
    private readonly assignmentsRepo: UserRoleAssignmentsRepository,
  ) {}

  /**
   * Códigos de rol que el usuario ejerce ahora mismo.
   *
   * Descarta la asignación cuya ventana de vigencia no cubre el instante dado
   * (`validFrom`/`validTo`) y el rol que ya no está activo: una asignación
   * caducada no debe conceder nada, y el token se emite con quince minutos de
   * vida, así que la revocación surte efecto en la siguiente renovación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Usuario del que se resuelven los roles.
   * @param now - Instante de referencia; por defecto, el actual.
   * @returns Los códigos, sin repetir y en orden estable.
   */
  async codesForUser(
    em: EntityManager,
    userId: string,
    now: Date = new Date(),
  ): Promise<string[]> {
    const assignments = await this.assignmentsRepo.findActiveForUser(
      em,
      userId,
      now,
    );
    if (assignments.length === 0) return [];

    const roles = await em.find(Roles, {
      id: { $in: [...new Set(assignments.map((a) => a.roleId))] },
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });

    return [...new Set(roles.map((r) => r.code))].sort();
  }

  /**
   * Igual que {@link codesForUser}, pero sin descartar el ámbito de la
   * asignación (MCH-001).
   *
   * `codesForUser` colapsa cada asignación a su código de rol: un rol concedido
   * sólo en el tenant A queda indistinguible de uno global, y cualquier
   * pertenencia a otro tenant lo hereda. Esto devuelve un par `(code, tenantId)`
   * por asignación, para que quien autorice pueda exigir que coincidan.
   *
   * Una asignación sin `tenantId` (columna nula) es una excepción global
   * deliberada del propio modelo de datos, no un olvido de esta consulta: se
   * conserva como tal (`tenantId: undefined`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param userId - Usuario del que se resuelven los roles.
   * @param now - Instante de referencia; por defecto, el actual.
   * @returns Un elemento por asignación activa, con su código y su tenant.
   */
  async scopedAssignmentsForUser(
    em: EntityManager,
    userId: string,
    now: Date = new Date(),
  ): Promise<{ code: string; tenantId?: string }[]> {
    const assignments = await this.assignmentsRepo.findActiveForUser(
      em,
      userId,
      now,
    );
    if (assignments.length === 0) return [];

    const roles = await em.find(Roles, {
      id: { $in: [...new Set(assignments.map((a) => a.roleId))] },
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    const codeById = new Map(roles.map((r) => [r.id, r.code]));

    const result: { code: string; tenantId?: string }[] = [];
    for (const a of assignments) {
      const code = codeById.get(a.roleId);
      if (code) result.push({ code, tenantId: a.tenantId });
    }
    return result;
  }

  /**
   * Garantiza que el usuario ejerza el rol indicado, sin duplicar la asignación.
   *
   * Se opera sobre la transacción del llamador para que la concesión del rol
   * viva o muera con el acto que la justifica —un alta de profesional, la
   * verificación de una matrícula—: un rol concedido junto a un alta que después
   * se deshace sería un privilegio sin sujeto que lo respalde.
   *
   * Devuelve `false` cuando el rol no existe o no es asignable, en vez de
   * lanzar: quien lo llama está completando un flujo mayor y necesita decidir si
   * eso es un fallo o sólo una configuración ausente.
   *
   * @param em - Transacción activa del llamador.
   * @param userId - Sujeto al que se concede el rol.
   * @param code - Código del rol (el mismo que exige `@Roles(...)`).
   * @param options - Ámbito y actor de la concesión.
   * @returns Si la asignación quedó en pie tras la llamada.
   */
  async ensureRoleByCode(
    em: EntityManager,
    userId: string,
    code: string,
    options: {
      /** Tenant en cuyo ámbito se concede. */
      tenantId?: string;
      /** Quién concede, para la trazabilidad de la fila. */
      actorUserId?: string;
    } = {},
  ): Promise<boolean> {
    const role = await em.findOne(Roles, {
      code,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    if (!role || !role.isAssignable) return false;

    const existing = await this.assignmentsRepo.findActive(em, userId, role.id);
    if (existing) return true;

    this.assignmentsRepo.create(em, {
      userId,
      roleId: role.id,
      tenantId: options.tenantId,
      assignedByUserId: options.actorUserId,
      validFrom: new Date(),
      actorUserId: options.actorUserId,
    });
    return true;
  }
}
