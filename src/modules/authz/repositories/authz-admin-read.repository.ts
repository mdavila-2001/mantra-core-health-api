import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';

export interface AssignmentRow {
  id: string;
  role_id: string;
  role_code: string;
  role_name: string;
  role_scope_concept_id: string | null;
  tenant_id: string | null;
  branch_id: string | null;
  practice_id: string | null;
  status_concept_id: string;
  valid_from: string | null;
  valid_to: string | null;
  assigned_by_user_id: string | null;
  created_at: string;
}

export interface PermissionRow {
  id: string;
  code: string;
  name: string;
  resource: string;
  category_id: string | null;
  is_dangerous: boolean | null;
  is_field_level: boolean | null;
  is_role_restricted: boolean;
}

export interface RolePermissionRow {
  permission_id: string;
  code: string;
  name: string;
  resource: string;
  effect_concept_id: string;
  scope_concept_id: string | null;
}

export interface InternalUserRow {
  id: string;
  display_name: string;
  status_concept_id: string;
  last_login_at: string | null;
}

export interface UserGlobalRoleRow {
  user_id: string;
  role_concept_id: string;
}

export interface InternalUsersFilter {
  q?: string;
  roleCode?: string;
  /** Conceptos de los roles globales de `iam` que hacen «interno» a un usuario. */
  platformRoleConceptIds: readonly string[];
  /** Concepto de ámbito global de `authz`. */
  globalScopeConceptId: string;
  activeStateConceptId: string;
  after?: { displayName: string; id: string };
  limit: number;
}

/** `%`, `_` y `\` de una búsqueda no son comodines: se escapan. */
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Lecturas de administración de acceso sobre `authz.*` e `iam.*`. Sólo `SELECT`: las escrituras
 * pasan por los servicios de dominio, con su sello de bitácora.
 */
@Injectable()
export class AuthzAdminReadRepository {
  private run<T>(
    em: EntityManager,
    sql: string,
    params: unknown[],
  ): Promise<T> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext()) as Promise<T>;
  }

  assignmentsOfUser(
    em: EntityManager,
    userId: string,
  ): Promise<AssignmentRow[]> {
    return this.run(
      em,
      `select a.id, a.role_id, r.code as role_code, r.name as role_name, r.scope_concept_id as role_scope_concept_id,
              a.tenant_id, a.branch_id, a.practice_id, a.status_concept_id,
              ${isoTimestampSql('a.valid_from')} as valid_from, ${isoTimestampSql('a.valid_to')} as valid_to,
              a.assigned_by_user_id, ${isoTimestampSql('a.created_at')} as created_at
         from authz.user_role_assignments a join authz.roles r on r.id = a.role_id
        where a.user_id = ?::uuid
        order by a.created_at desc, a.id desc`,
      [userId],
    );
  }

  async userExists(em: EntityManager, userId: string): Promise<boolean> {
    const filas = await this.run<{ id: string }[]>(
      em,
      'select id from iam.users where id = ?::uuid',
      [userId],
    );
    return filas.length > 0;
  }

  async roleCodeOf(em: EntityManager, roleId: string): Promise<string | null> {
    const filas = await this.run<{ code: string }[]>(
      em,
      'select code from authz.roles where id = ?::uuid',
      [roleId],
    );
    return filas[0]?.code ?? null;
  }

  /** Permisos por código, con cursor `(code)`; un elemento de más para saber si hay otra página. */
  permissions(
    em: EntityManager,
    f: { q?: string; categoryId?: string; afterCode?: string; limit: number },
  ): Promise<PermissionRow[]> {
    const where: string[] = ['true'];
    const params: unknown[] = [];
    if (f.q) {
      const patron = `%${escaparLike(f.q.toLowerCase())}%`;
      where.push(
        `(lower(p.code) like ? escape '\\' or lower(p.name) like ? escape '\\' or lower(p.resource) like ? escape '\\')`,
      );
      params.push(patron, patron, patron);
    }
    if (f.categoryId) {
      where.push('p.category_id = ?::uuid');
      params.push(f.categoryId);
    }
    if (f.afterCode !== undefined) {
      where.push('p.code > ?');
      params.push(f.afterCode);
    }
    params.push(f.limit + 1);
    return this.run(
      em,
      `select p.id, p.code, p.name, p.resource, p.category_id, p.is_dangerous, p.is_field_level, p.is_role_restricted
         from authz.permissions p
        where ${where.join(' and ')}
        order by p.code
        limit ?`,
      params,
    );
  }

  /** Permisos activos de un rol, con su efecto y ámbito. */
  rolePermissions(
    em: EntityManager,
    roleId: string,
    activeStateConceptId: string,
  ): Promise<RolePermissionRow[]> {
    return this.run(
      em,
      `select rp.permission_id, p.code, p.name, p.resource, rp.effect_concept_id, rp.scope_concept_id
         from authz.role_permissions rp join authz.permissions p on p.id = rp.permission_id
        where rp.role_id = ?::uuid and rp.state_concept_id = ?::uuid
        order by p.code`,
      [roleId, activeStateConceptId],
    );
  }

  /**
   * Usuarios internos por nombre visible. Con `roleCode`, quienes tienen ese rol activo en
   * cualquier ámbito; sin él, quienes tienen un rol activo de ámbito global o un rol global de
   * plataforma de `iam`.
   */
  internalUsers(
    em: EntityManager,
    f: InternalUsersFilter,
  ): Promise<InternalUserRow[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (f.roleCode) {
      where.push(
        `exists (select 1 from authz.user_role_assignments a join authz.roles r on r.id = a.role_id
                  where a.user_id = u.id and a.status_concept_id = ?::uuid and r.code = ?)`,
      );
      params.push(f.activeStateConceptId, f.roleCode);
    } else {
      where.push(
        `(exists (select 1 from authz.user_role_assignments a join authz.roles r on r.id = a.role_id
                   where a.user_id = u.id and a.status_concept_id = ?::uuid and r.scope_concept_id = ?::uuid)
          or exists (select 1 from iam.user_global_roles g
                      where g.user_id = u.id and g.state_concept_id = ?::uuid
                        and g.role_concept_id in (select value::uuid from jsonb_array_elements_text(?::jsonb))))`,
      );
      params.push(
        f.activeStateConceptId,
        f.globalScopeConceptId,
        f.activeStateConceptId,
        JSON.stringify(f.platformRoleConceptIds),
      );
    }
    if (f.q) {
      where.push(`lower(u.display_name) like ? escape '\\'`);
      params.push(`%${escaparLike(f.q.toLowerCase())}%`);
    }
    if (f.after) {
      where.push('(u.display_name, u.id) > (?, ?::uuid)');
      params.push(f.after.displayName, f.after.id);
    }
    params.push(f.limit + 1);
    return this.run(
      em,
      `select u.id, u.display_name, u.status_concept_id, ${isoTimestampSql('u.last_login_at')} as last_login_at
         from iam.users u
        where ${where.join(' and ')}
        order by u.display_name, u.id
        limit ?`,
      params,
    );
  }

  /** Asignaciones activas de un conjunto de usuarios, con su rol. */
  activeAssignmentsOf(
    em: EntityManager,
    userIds: string[],
    activeStateConceptId: string,
  ): Promise<(AssignmentRow & { user_id: string })[]> {
    if (!userIds.length) return Promise.resolve([]);
    return this.run(
      em,
      `select a.user_id, a.id, a.role_id, r.code as role_code, r.name as role_name, r.scope_concept_id as role_scope_concept_id,
              a.tenant_id, a.branch_id, a.practice_id, a.status_concept_id,
              ${isoTimestampSql('a.valid_from')} as valid_from, ${isoTimestampSql('a.valid_to')} as valid_to,
              a.assigned_by_user_id, ${isoTimestampSql('a.created_at')} as created_at
         from authz.user_role_assignments a join authz.roles r on r.id = a.role_id
        where a.status_concept_id = ?::uuid
          and a.user_id in (select value::uuid from jsonb_array_elements_text(?::jsonb))
        order by r.code, a.id`,
      [activeStateConceptId, JSON.stringify(userIds)],
    );
  }

  /** Roles globales de `iam` activos de un conjunto de usuarios. */
  globalRolesOf(
    em: EntityManager,
    userIds: string[],
    activeStateConceptId: string,
  ): Promise<UserGlobalRoleRow[]> {
    if (!userIds.length) return Promise.resolve([]);
    return this.run(
      em,
      `select g.user_id, g.role_concept_id from iam.user_global_roles g
        where g.state_concept_id = ?::uuid
          and g.user_id in (select value::uuid from jsonb_array_elements_text(?::jsonb))`,
      [activeStateConceptId, JSON.stringify(userIds)],
    );
  }
}
