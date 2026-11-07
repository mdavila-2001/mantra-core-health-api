import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../src/common';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { AUTHZ } from '../../src/modules/authz/authz.concepts';
import { UsersDirectoryReadAdapter } from '../../src/modules/authz/infrastructure/users-directory-read.adapter';
import type {
  DirectoryScope,
  DirectoryUserRow,
} from '../../src/modules/authz/ports/users-directory-read.port';

/**
 * Users directory SQL against a real PostgreSQL (no mocks of the database).
 *
 * Fixes: org isolation, user-type rules, effective permission summary (deny
 * wins, direct grants), email masking input, and a query count that does not
 * grow with the page size. Only inserts its own marked rows and removes them.
 */
describe('Users directory read adapter (integration)', () => {
  const adapter = new UsersDirectoryReadAdapter();
  const mark = randomUUID().slice(0, 8);
  const ids: Record<string, string> = {};
  const created: Array<[string, string, string]> = [];
  let db: Client;
  let statements = 0;

  /** Minimal EntityManager over a real connection; counts every statement. */
  const em = {
    getTransactionContext: () => undefined,
    getConnection: () => ({
      execute: async (sql: string, params: unknown[] = []) => {
        statements += 1;
        let i = 0;
        const res = await db.query(
          sql.replace(/\?/g, () => `$${++i}`),
          params,
        );
        return res.rows;
      },
    }),
  } as unknown as EntityManager;

  /** Inserts a row, filling every NOT NULL column without default. */
  async function insert(
    table: string,
    values: Record<string, unknown>,
    key = 'id',
  ): Promise<string> {
    const [schema, name] = table.split('.');
    const cols = await db.query(
      `select column_name, data_type from information_schema.columns
        where table_schema = $1 and table_name = $2 and is_nullable = 'NO' and column_default is null`,
      [schema, name],
    );
    const row: Record<string, unknown> = { ...values };
    for (const c of cols.rows) {
      if (c.column_name in row) continue;
      row[c.column_name] =
        c.data_type === 'uuid'
          ? randomUUID()
          : c.data_type.startsWith('timestamp')
            ? new Date()
            : c.data_type === 'boolean'
              ? false
              : c.data_type === 'integer'
                ? 0
                : `x-${mark}`;
    }
    if (key in row === false && cols.rows.some((c) => c.column_name === key))
      row[key] = randomUUID();
    const names = Object.keys(row);
    const res = await db.query(
      `insert into ${table} (${names.map((n) => `"${n}"`).join(',')})
       values (${names.map((_, i) => `$${i + 1}`).join(',')}) returning "${key}"`,
      names.map((n) => row[n]),
    );
    created.push([table, key, res.rows[0][key]]);
    return res.rows[0][key];
  }

  const user = (label: string, extra: Record<string, unknown> = {}) =>
    insert('iam.users', {
      status_concept_id: CONCEPTS.USER_ACTIVE,
      display_name: `${mark}-${label}`,
      ...extra,
    });
  const member = (userId: string, tenantId: string) =>
    insert('directory.tenant_memberships', {
      user_id: userId,
      tenant_id: tenantId,
      status_concept_id: DIR.MEMBERSHIP_ACTIVE,
      end_date: null,
    });
  const tenant = (label: string, type: string) =>
    insert('directory.tenants', {
      code: `${mark}-${label}`,
      tenant_type_concept_id: type,
      legal_name: `${mark}-${label}`,
    });
  const assign = (userId: string, roleId: string, tenantId: string | null) =>
    insert('authz.user_role_assignments', {
      user_id: userId,
      role_id: roleId,
      tenant_id: tenantId,
      status_concept_id: CONCEPTS.STATE_ACTIVE,
      valid_from: null,
      valid_to: null,
    });
  const permission = (label: string, dangerous: boolean) =>
    insert('authz.permissions', {
      code: `${mark}.${label}`,
      name: label,
      resource: mark,
      is_dangerous: dangerous,
    });
  const rolePerm = (roleId: string, permissionId: string, effect: string) =>
    insert('authz.role_permissions', {
      role_id: roleId,
      permission_id: permissionId,
      effect_concept_id: effect,
      state_concept_id: CONCEPTS.STATE_ACTIVE,
    });

  /** Walks every page; returns only this run's rows. */
  async function collect(scope: DirectoryScope, limit = 2) {
    const out: DirectoryUserRow[] = [];
    let after: { displayName: string; id: string } | undefined;
    for (let guard = 0; guard < 500; guard += 1) {
      const rows = await adapter.page(em, { limit, after }, scope);
      const page = rows.slice(0, limit);
      out.push(...page.filter((r) => r.displayName.startsWith(mark)));
      if (rows.length <= limit) break;
      after = { displayName: page.at(-1)!.displayName, id: page.at(-1)!.id };
    }
    return out;
  }

  beforeAll(async () => {
    db = new Client({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await db.connect();

    ids.pharmacy = await tenant('pharmacy', CONCEPTS.TENANT_TYPE_PHARMACY);
    ids.lab = await tenant('lab', CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER);
    ids.clinic = await tenant('clinic', CONCEPTS.TENANT_TYPE_CLINIC);

    ids.pharmacist = await user('pharmacist');
    await member(ids.pharmacist, ids.pharmacy);
    ids.labTech = await user('lab-tech');
    await member(ids.labTech, ids.lab);
    ids.doctor = await user('doctor');
    await member(ids.doctor, ids.clinic);
    await insert(
      'profiles.health_practitioner_profiles',
      {
        profile_id: (ids.doctorPerson = randomUUID()),
      },
      'profile_id',
    );
    await insert('profiles.person_account_links', {
      user_id: ids.doctor,
      person_id: ids.doctorPerson,
      status_concept_id: PROF.ACCOUNT_LINK_ACTIVE,
    });
    ids.patient = await user('patient');
    await insert('iam.user_global_roles', {
      user_id: ids.patient,
      role_concept_id: CONCEPTS.ROLE_PATIENT,
      state_concept_id: CONCEPTS.STATE_ACTIVE,
    });
    ids.admin = await user('admin');
    await insert('iam.user_global_roles', {
      user_id: ids.admin,
      role_concept_id: CONCEPTS.ROLE_SECURITY_ADMIN,
      state_concept_id: CONCEPTS.STATE_ACTIVE,
    });
    ids.plain = await user('plain');
    await member(ids.plain, ids.clinic);
    ids.anonymized = await user('anonymized', { anonymized_at: new Date() });
    await member(ids.anonymized, ids.clinic);

    await insert('iam.authentication_credentials', {
      user_id: ids.doctor,
      method_concept_id: CONCEPTS.CRED_PASSWORD,
      external_subject: `ana.${mark}@clinica.org`,
      secret_hash: 'HASH-MUST-NOT-LEAK',
      state_concept_id: CONCEPTS.STATE_ACTIVE,
    });
    await insert('iam.authentication_credentials', {
      user_id: ids.plain,
      method_concept_id: CONCEPTS.CRED_PASSWORD,
      external_subject: `DOC-${mark}`,
      state_concept_id: CONCEPTS.STATE_ACTIVE,
    });

    // Effective permissions of `plain` in the clinic: role allows a, b (b dangerous)
    // and denies c; a direct grant allows d and a direct grant denies a.
    ids.role = await insert('authz.roles', {
      code: `${mark}-ROLE`,
      name: 'Role',
      state_concept_id: CONCEPTS.STATE_ACTIVE,
      is_system: false,
      is_assignable: true,
    });
    await assign(ids.plain, ids.role, ids.clinic);
    const [a, b, c, d] = [
      await permission('a', false),
      await permission('b', true),
      await permission('c', false),
      await permission('d', false),
    ];
    await rolePerm(ids.role, a, AUTHZ.EFFECT_ALLOW);
    await rolePerm(ids.role, b, AUTHZ.EFFECT_ALLOW);
    await rolePerm(ids.role, c, AUTHZ.EFFECT_DENY);
    for (const [permissionId, effect] of [
      [d, AUTHZ.EFFECT_ALLOW],
      [a, AUTHZ.EFFECT_DENY],
    ])
      await insert('authz.user_permission_grants', {
        user_id: ids.plain,
        permission_id: permissionId,
        effect_concept_id: effect,
        tenant_id: ids.clinic,
        state_concept_id: CONCEPTS.STATE_ACTIVE,
        valid_from: null,
        valid_to: null,
      });
    // Same user also holds a role in ANOTHER organization: must not leak into clinic scope.
    await assign(ids.plain, ids.role, ids.lab);
  });

  afterAll(async () => {
    for (const [table, key, id] of created.reverse())
      await db.query(`delete from ${table} where "${key}" = $1`, [id]);
    await db.end();
  });

  const typeOf = async (scope: DirectoryScope) =>
    Object.fromEntries((await collect(scope)).map((r) => [r.id, r.userType]));

  it('classifies each account kind (platform scope)', async () => {
    const t = await typeOf({});
    expect(t[ids.pharmacist]).toBe('PHARMACY');
    expect(t[ids.labTech]).toBe('LABORATORY');
    expect(t[ids.doctor]).toBe('PRACTITIONER');
    expect(t[ids.patient]).toBe('PATIENT');
    expect(t[ids.admin]).toBe('INTERNAL');
    expect(t[ids.plain]).toBe('OTHER');
    expect(ids.anonymized in t).toBe(false);
  });

  it('holds an organization-scoped admin to that organization only', async () => {
    const clinic = await typeOf({ tenantId: ids.clinic });
    expect(Object.keys(clinic).sort()).toEqual([ids.doctor, ids.plain].sort());
    const pharmacy = await typeOf({ tenantId: ids.pharmacy });
    expect(Object.keys(pharmacy)).toEqual([ids.pharmacist]);
    // Kill-test: no account of another organization leaks.
    expect(ids.labTech in clinic).toBe(false);
    expect(ids.patient in clinic).toBe(false);
    expect(ids.admin in clinic).toBe(false);
  });

  it('filters by type and keeps keyset paging stable', async () => {
    const rows = await adapter.page(em, { type: 'PHARMACY', limit: 500 }, {});
    expect(rows.every((r) => r.userType === 'PHARMACY')).toBe(true);
    expect(rows.map((r) => r.id)).toContain(ids.pharmacist);
    const all = await collect({}, 1);
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
  });

  it('summarizes effective permissions: deny wins, direct grants counted, other tenant excluded', async () => {
    const [clinic] = await adapter.permissionSummary(em, [ids.plain], {
      tenantId: ids.clinic,
    });
    // allowed: b (role) and d (direct); a is denied by the direct grant, c by the role.
    expect(clinic).toEqual({
      userId: ids.plain,
      allowCount: 2,
      denyCount: 2,
      dangerousCount: 1,
      directGrantCount: 2,
    });
    const roles = await adapter.roles(em, [ids.plain], {
      tenantId: ids.clinic,
    });
    expect(roles.map((r) => r.tenantId)).toEqual([ids.clinic]);
    const platformRoles = await adapter.roles(em, [ids.plain], {});
    expect(platformRoles).toHaveLength(2);
  });

  it('exposes a login subject only when it is an email, and never a secret', async () => {
    const subjects = await adapter.loginSubjects(em, [ids.doctor, ids.plain]);
    expect(subjects).toEqual([
      { userId: ids.doctor, subject: `ana.${mark}@clinica.org` },
    ]);
    expect(JSON.stringify(subjects)).not.toContain('HASH-MUST-NOT-LEAK');
  });

  it('runs a constant number of statements per page, whatever its size', async () => {
    const count = async (limit: number) => {
      statements = 0;
      const rows = (await adapter.page(em, { limit }, {})).slice(0, limit);
      const page = rows.map((r) => r.id);
      await adapter.roles(em, page, {});
      await adapter.permissionSummary(em, page, {});
      await adapter.loginSubjects(em, page);
      return statements;
    };
    expect(await count(1)).toBe(4);
    expect(await count(50)).toBe(4);
  });
});
