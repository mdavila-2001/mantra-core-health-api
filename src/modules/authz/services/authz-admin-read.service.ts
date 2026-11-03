import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, ResourceNotFoundException } from '../../../common';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
} from '../../../common/pagination/keyset-cursor';
import { ROLE_CODE_BY_CONCEPT } from '../../iam/domain/role-mapping';
import { AUTHZ } from '../authz.concepts';
import { AuthzErrorReason } from '../authz.error-reasons';
import {
  AUTHZ_ADMIN_DEFAULT_PAGE_SIZE,
  type InternalUsersPageDto,
  type InternalUsersQueryDto,
  type PermissionsPageDto,
  type PermissionsQueryDto,
  type RolePermissionsDto,
  type UserRoleAssignmentDto,
  type UserRoleAssignmentsDto,
} from '../dto/authz-admin.dto';
import {
  AuthzAdminReadRepository,
  type AssignmentRow,
} from '../repositories/authz-admin-read.repository';

/** Roles globales de `iam` que hacen «interno» a un usuario: los de plataforma. */
const PLATFORM_GLOBAL_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'] as const;

const STATUS_BY_CONCEPT: Readonly<
  Record<string, 'ACTIVE' | 'REVOKED' | 'EXPIRED'>
> = {
  [CONCEPTS.STATE_ACTIVE]: 'ACTIVE',
  [CONCEPTS.STATE_REVOKED]: 'REVOKED',
  [CONCEPTS.STATE_EXPIRED]: 'EXPIRED',
};

const SCOPE_BY_CONCEPT: Readonly<Record<string, string>> = {
  [AUTHZ.SCOPE_SELF]: 'SELF',
  [AUTHZ.SCOPE_BRANCH]: 'BRANCH',
  [AUTHZ.SCOPE_TENANT]: 'TENANT',
  [AUTHZ.SCOPE_GLOBAL]: 'GLOBAL',
};

const EFFECT_BY_CONCEPT: Readonly<Record<string, 'ALLOW' | 'DENY'>> = {
  [AUTHZ.EFFECT_ALLOW]: 'ALLOW',
  [AUTHZ.EFFECT_DENY]: 'DENY',
};

const CONCEPT_BY_PLATFORM_ROLE: Readonly<Record<string, string>> =
  Object.fromEntries(
    Object.entries(ROLE_CODE_BY_CONCEPT).map(([concepto, codigo]) => [
      codigo,
      concepto,
    ]),
  );

/**
 * Lecturas de administración de acceso que faltaban en `authz`: asignaciones de un usuario,
 * catálogo de permisos, permisos de un rol y usuarios internos con sus roles. Ninguna escribe.
 *
 * Los estados, ámbitos y efectos se presentan por su código (`ACTIVE`, `GLOBAL`, `ALLOW`), nunca
 * por el id del concepto.
 */
@Injectable()
export class AuthzAdminReadService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AuthzAdminReadRepository,
  ) {}

  async assignmentsOf(
    userId: string,
    now: Date = new Date(),
  ): Promise<UserRoleAssignmentsDto> {
    const em = this.em.fork();
    if (!(await this.repo.userExists(em, userId)))
      throw new ResourceNotFoundException(
        'Usuario no encontrado',
        { userId },
        AuthzErrorReason.ROLE_ASSIGNMENT_USER_NOT_FOUND,
      );
    const filas = await this.repo.assignmentsOfUser(em, userId);
    return { userId, items: filas.map((f) => presentarAsignacion(f, now)) };
  }

  async permissions(q: PermissionsQueryDto): Promise<PermissionsPageDto> {
    const limit = q.limit ?? AUTHZ_ADMIN_DEFAULT_PAGE_SIZE;
    const despues = q.cursor ? decodeKeysetCursor(q.cursor) : undefined;
    if (despues && typeof despues.code !== 'string')
      throw new BadRequestException('El cursor de paginación no es válido');
    const filas = await this.repo.permissions(this.em.fork(), {
      q: q.q,
      categoryId: q.categoryId,
      afterCode: despues?.code as string | undefined,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ultimo = pagina[pagina.length - 1];
    return {
      items: pagina.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        resource: p.resource,
        categoryId: p.category_id,
        isDangerous: p.is_dangerous ?? false,
        isFieldLevel: p.is_field_level ?? false,
        isRoleRestricted: p.is_role_restricted,
      })),
      nextCursor:
        hayMas && ultimo ? encodeKeysetCursor({ code: ultimo.code }) : null,
      limit,
    };
  }

  async rolePermissions(roleId: string): Promise<RolePermissionsDto> {
    const em = this.em.fork();
    const roleCode = await this.repo.roleCodeOf(em, roleId);
    if (roleCode === null)
      throw new ResourceNotFoundException(
        'Rol no encontrado',
        { roleId },
        AuthzErrorReason.ROLE_NOT_FOUND,
      );
    const filas = await this.repo.rolePermissions(
      em,
      roleId,
      CONCEPTS.STATE_ACTIVE,
    );
    return {
      roleId,
      roleCode,
      items: filas.map((f) => ({
        permissionId: f.permission_id,
        code: f.code,
        name: f.name,
        resource: f.resource,
        effect: EFFECT_BY_CONCEPT[f.effect_concept_id] ?? 'OTHER',
        scope: f.scope_concept_id
          ? (SCOPE_BY_CONCEPT[f.scope_concept_id] ?? null)
          : null,
      })),
    };
  }

  async internalUsers(q: InternalUsersQueryDto): Promise<InternalUsersPageDto> {
    const limit = q.limit ?? AUTHZ_ADMIN_DEFAULT_PAGE_SIZE;
    const k = q.cursor ? decodeKeysetCursor(q.cursor) : undefined;
    if (k && (typeof k.n !== 'string' || typeof k.i !== 'string'))
      throw new BadRequestException('El cursor de paginación no es válido');
    const em = this.em.fork();
    const filas = await this.repo.internalUsers(em, {
      q: q.q,
      roleCode: q.roleCode,
      platformRoleConceptIds: PLATFORM_GLOBAL_ROLES.map(
        (codigo) => CONCEPT_BY_PLATFORM_ROLE[codigo],
      ),
      globalScopeConceptId: AUTHZ.SCOPE_GLOBAL,
      activeStateConceptId: CONCEPTS.STATE_ACTIVE,
      after: k ? { displayName: k.n as string, id: k.i as string } : undefined,
      limit,
    });
    const hayMas = filas.length > limit;
    const pagina = hayMas ? filas.slice(0, limit) : filas;
    const ids = pagina.map((u) => u.id);
    const [asignaciones, globales] = await Promise.all([
      this.repo.activeAssignmentsOf(em, ids, CONCEPTS.STATE_ACTIVE),
      this.repo.globalRolesOf(em, ids, CONCEPTS.STATE_ACTIVE),
    ]);
    const ultimo = pagina[pagina.length - 1];
    return {
      items: pagina.map((u) => ({
        id: u.id,
        displayName: u.display_name,
        statusConceptId: u.status_concept_id,
        lastLoginAt: u.last_login_at,
        globalRoles: globales
          .filter((g) => g.user_id === u.id)
          .map((g) => ROLE_CODE_BY_CONCEPT[g.role_concept_id])
          .filter((codigo): codigo is NonNullable<typeof codigo> =>
            Boolean(codigo),
          )
          .sort(),
        assignments: asignaciones
          .filter((a) => a.user_id === u.id)
          .map((a) => ({
            assignmentId: a.id,
            roleCode: a.role_code,
            roleName: a.role_name,
            tenantId: a.tenant_id,
            validTo: a.valid_to,
          })),
      })),
      nextCursor:
        hayMas && ultimo
          ? encodeKeysetCursor({ n: ultimo.display_name, i: ultimo.id })
          : null,
      limit,
    };
  }
}

export function presentarAsignacion(
  f: AssignmentRow,
  now: Date,
): UserRoleAssignmentDto {
  const estado = STATUS_BY_CONCEPT[f.status_concept_id] ?? 'OTHER';
  const desde = f.valid_from ? new Date(f.valid_from) : null;
  const hasta = f.valid_to ? new Date(f.valid_to) : null;
  const vigente = (!desde || desde <= now) && (!hasta || hasta > now);
  const ambito = f.role_scope_concept_id
    ? (SCOPE_BY_CONCEPT[f.role_scope_concept_id] ?? null)
    : null;
  const sinAmbito = !f.tenant_id && !f.branch_id && !f.practice_id;
  return {
    id: f.id,
    roleId: f.role_id,
    roleCode: f.role_code,
    roleName: f.role_name,
    roleScope: ambito,
    tenantId: f.tenant_id,
    branchId: f.branch_id,
    practiceId: f.practice_id,
    status: estado,
    validFrom: f.valid_from,
    validTo: f.valid_to,
    isEffective: estado === 'ACTIVE' && vigente,
    appliesGlobally: ambito === 'GLOBAL' && sinAmbito,
    assignedByUserId: f.assigned_by_user_id,
    createdAt: f.created_at,
  };
}
