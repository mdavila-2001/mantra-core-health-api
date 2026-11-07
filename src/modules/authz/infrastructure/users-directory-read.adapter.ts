import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import { DIR } from '../../directory/directory.concepts';
import { PROF } from '../../profiles/profiles.concepts';
import { AUTHZ } from '../authz.concepts';
import type {
  DirectoryFilter,
  DirectoryPermissionRow,
  DirectoryRoleRow,
  DirectoryScope,
  DirectorySubjectRow,
  DirectoryUserRow,
  UsersDirectoryReadPort,
} from '../ports/users-directory-read.port';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Inlines a code-owned concept id as a uuid literal; refuses anything else. */
function lit(...ids: string[]): string {
  for (const id of ids) {
    if (!UUID.test(id)) throw new Error('Concept id is not a UUID');
  }
  return ids.map((id) => `'${id}'::uuid`).join(', ');
}

const ACTIVE = lit(CONCEPTS.STATE_ACTIVE);
const MEMBERSHIPS = lit(DIR.MEMBERSHIP_ACTIVE, CONCEPTS.MEMBERSHIP_ACTIVE);

const global = (roles: string[]) =>
  `exists (select 1 from iam.user_global_roles g where g.user_id = u.id and g.state_concept_id = ${ACTIVE} and g.role_concept_id in (${lit(...roles)}))`;
const tenantOfType = (type: string) =>
  `exists (select 1 from directory.tenant_memberships m join directory.tenants t on t.id = m.tenant_id
            where m.user_id = u.id and m.status_concept_id in (${MEMBERSHIPS})
              and (m.end_date is null or m.end_date > now()) and t.tenant_type_concept_id = ${lit(type)})`;
const linkedProfile = (table: string) =>
  `exists (select 1 from profiles.person_account_links l join ${table} p on p.profile_id = l.person_id
            where l.user_id = u.id and l.status_concept_id = ${lit(PROF.ACCOUNT_LINK_ACTIVE)})`;

/** User kind, decided in SQL so the type filter and keyset paging agree. Priority = branch order. */
const USER_TYPE_SQL = `case
  when ${global([CONCEPTS.ROLE_SECURITY_ADMIN, CONCEPTS.ROLE_SUPERADMIN])}
    or exists (select 1 from authz.user_role_assignments a join authz.roles r on r.id = a.role_id
                where a.user_id = u.id and a.status_concept_id = ${ACTIVE} and r.scope_concept_id = ${lit(AUTHZ.SCOPE_GLOBAL)}) then 'INTERNAL'
  when ${global([CONCEPTS.ROLE_PRACTITIONER, CONCEPTS.ROLE_CLINICIAN])}
    or ${linkedProfile('profiles.health_practitioner_profiles')} then 'PRACTITIONER'
  when ${tenantOfType(CONCEPTS.TENANT_TYPE_PHARMACY)} then 'PHARMACY'
  when ${tenantOfType(CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER)} then 'LABORATORY'
  when ${global([CONCEPTS.ROLE_PATIENT])} or ${linkedProfile('profiles.patient_profiles')} then 'PATIENT'
  else 'OTHER' end`;

/** Users that belong to the organization: an active membership or a live assignment in it. */
const IN_TENANT_SQL = `(exists (select 1 from directory.tenant_memberships m
    where m.user_id = u.id and m.tenant_id = ?::uuid and m.status_concept_id in (${MEMBERSHIPS})
      and (m.end_date is null or m.end_date > now()))
  or exists (select 1 from authz.user_role_assignments a
    where a.user_id = u.id and a.tenant_id = ?::uuid and a.status_concept_id = ${ACTIVE}))`;

/** Read-only SQL adapter of the users directory: one query per concern, never per user. */
@Injectable()
export class UsersDirectoryReadAdapter implements UsersDirectoryReadPort {
  private run<T>(
    em: EntityManager,
    sql: string,
    params: unknown[],
  ): Promise<T[]> {
    return em
      .getConnection()
      .execute(sql, params, 'all', em.getTransactionContext());
  }

  async page(
    em: EntityManager,
    f: DirectoryFilter,
    scope: DirectoryScope,
  ): Promise<DirectoryUserRow[]> {
    const where: string[] = ['u.anonymized_at is null'];
    const params: unknown[] = [];
    if (scope.tenantId) {
      where.push(IN_TENANT_SQL);
      params.push(scope.tenantId, scope.tenantId);
    }
    if (f.statusConceptId) {
      where.push('u.status_concept_id = ?::uuid');
      params.push(f.statusConceptId);
    }
    if (f.roleCode) {
      where.push(`exists (select 1 from authz.user_role_assignments a join authz.roles r on r.id = a.role_id
        where a.user_id = u.id and a.status_concept_id = ${ACTIVE} and r.code = ?
          and (?::uuid is null or a.tenant_id = ?::uuid))`);
      params.push(f.roleCode, scope.tenantId ?? null, scope.tenantId ?? null);
    }
    if (f.after) {
      where.push('(u.display_name, u.id) > (?, ?::uuid)');
      params.push(f.after.displayName, f.after.id);
    }
    const outer = f.type ? 'where x.user_type = ?' : '';
    if (f.type) params.push(f.type);
    params.push(f.limit + 1);
    const rows = await this.run<{
      id: string;
      display_name: string;
      status_concept_id: string;
      mfa_status_concept_id: string | null;
      last_login_at: string | null;
      user_type: DirectoryUserRow['userType'];
    }>(
      em,
      `select x.* from (
         select u.id, u.display_name, u.status_concept_id, u.mfa_status_concept_id,
                ${isoTimestampSql('u.last_login_at')} as last_login_at, ${USER_TYPE_SQL} as user_type
           from iam.users u where ${where.join(' and ')}
       ) x ${outer} order by x.display_name, x.id limit ?`,
      params,
    );
    return rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      statusConceptId: r.status_concept_id,
      mfaStatusConceptId: r.mfa_status_concept_id,
      lastLoginAt: r.last_login_at,
      userType: r.user_type,
    }));
  }

  async roles(
    em: EntityManager,
    ids: readonly string[],
    scope: DirectoryScope,
  ): Promise<DirectoryRoleRow[]> {
    if (ids.length === 0) return [];
    const rows = await this.run<{
      user_id: string;
      id: string;
      code: string;
      name: string;
      tenant_id: string | null;
      valid_to: string | null;
    }>(
      em,
      `select a.user_id, a.id, r.code, r.name, a.tenant_id, ${isoTimestampSql('a.valid_to')} as valid_to
         from authz.user_role_assignments a join authz.roles r on r.id = a.role_id
        where a.user_id = any(?::uuid[]) and a.status_concept_id = ${ACTIVE}
          and (a.valid_from is null or a.valid_from <= now()) and (a.valid_to is null or a.valid_to > now())
          and (?::uuid is null or a.tenant_id = ?::uuid)
        order by r.code, a.id`,
      [`{${ids.join(',')}}`, scope.tenantId ?? null, scope.tenantId ?? null],
    );
    return rows.map((r) => ({
      userId: r.user_id,
      assignmentId: r.id,
      roleCode: r.code,
      roleName: r.name,
      tenantId: r.tenant_id,
      validTo: r.valid_to,
    }));
  }

  async permissionSummary(
    em: EntityManager,
    ids: readonly string[],
    scope: DirectoryScope,
  ): Promise<DirectoryPermissionRow[]> {
    if (ids.length === 0) return [];
    const t = scope.tenantId ?? null;
    const rows = await this.run<{
      user_id: string;
      allow_count: number;
      deny_count: number;
      dangerous_count: number;
      direct_count: number;
    }>(
      em,
      `with eff as (
         select a.user_id, rp.permission_id, rp.effect_concept_id, false as direct
           from authz.user_role_assignments a
           join authz.roles r on r.id = a.role_id and r.state_concept_id = ${ACTIVE}
           join authz.role_permissions rp on rp.role_id = r.id and rp.state_concept_id = ${ACTIVE}
          where a.user_id = any(?::uuid[]) and a.status_concept_id = ${ACTIVE}
            and (a.valid_from is null or a.valid_from <= now()) and (a.valid_to is null or a.valid_to > now())
            and (?::uuid is null or a.tenant_id = ?::uuid)
         union all
         select g.user_id, g.permission_id, g.effect_concept_id, true
           from authz.user_permission_grants g
          where g.user_id = any(?::uuid[]) and g.state_concept_id = ${ACTIVE}
            and (g.valid_from is null or g.valid_from <= now()) and (g.valid_to is null or g.valid_to > now())
            and (?::uuid is null or g.tenant_id = ?::uuid)
       ), denied as (
         select user_id, permission_id from eff where effect_concept_id = ${lit(AUTHZ.EFFECT_DENY)} group by 1, 2
       ), allowed as (
         select e.user_id, e.permission_id from eff e
          where e.effect_concept_id = ${lit(AUTHZ.EFFECT_ALLOW)}
            and not exists (select 1 from denied d where d.user_id = e.user_id and d.permission_id = e.permission_id)
          group by 1, 2
       )
       select u.id as user_id,
              (select count(*) from allowed w where w.user_id = u.id)::int as allow_count,
              (select count(*) from denied d where d.user_id = u.id)::int as deny_count,
              (select count(*) from allowed w join authz.permissions p on p.id = w.permission_id
                where w.user_id = u.id and p.is_dangerous is true)::int as dangerous_count,
              (select count(*) from eff e where e.user_id = u.id and e.direct)::int as direct_count
         from iam.users u where u.id = any(?::uuid[])`,
      [
        `{${ids.join(',')}}`,
        t,
        t,
        `{${ids.join(',')}}`,
        t,
        t,
        `{${ids.join(',')}}`,
      ],
    );
    return rows.map((r) => ({
      userId: r.user_id,
      allowCount: r.allow_count,
      denyCount: r.deny_count,
      dangerousCount: r.dangerous_count,
      directGrantCount: r.direct_count,
    }));
  }

  async loginSubjects(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<DirectorySubjectRow[]> {
    if (ids.length === 0) return [];
    const rows = await this.run<{ user_id: string; external_subject: string }>(
      em,
      `select distinct on (user_id) user_id, external_subject
         from iam.authentication_credentials
        where user_id = any(?::uuid[]) and method_concept_id = ${lit(CONCEPTS.CRED_PASSWORD)}
          and external_subject like '%@%'
        order by user_id, created_at desc`,
      [`{${ids.join(',')}}`],
    );
    return rows.map((r) => ({
      userId: r.user_id,
      subject: r.external_subject,
    }));
  }
}
