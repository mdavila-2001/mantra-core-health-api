import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MikroORM, type EntityManager } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import pg from 'pg';
import { runWithTenant } from '../../src/common';
import { applyTenantRls } from '../../src/common/tenant/rls-transaction';
import { ConditionsHistory } from '../../src/modules/audit/entities';
import {
  Conditions,
  DiagnosticReports,
  EncounterParticipants,
  Encounters,
  ObservationReferenceRanges,
  Observations,
  ServiceRequests,
} from '../../src/modules/clinical/entities';
import { Referrals } from '../../src/modules/clinical_ext/entities';
import { FileVersions, Files } from '../../src/modules/common/entities';
import {
  DiagnosticReleaseEvents,
  DiagnosticReportFiles,
  DiagnosticReportResults,
  DiagnosticReportVersions,
} from '../../src/modules/diagnostics/entities';
import {
  PersonAccountLinks,
  PractitionerSpecialties,
} from '../../src/modules/profiles/entities';
import { CatalogConcepts } from '../../src/modules/terminology/entities';

/**
 * Owner connection, runtime role and row seeding for
 * `red-clinica-vinculos-e-informes.int-spec.ts`.
 *
 * Needs a DISPOSABLE PostgreSQL built from `database/SQL` (apply_all, deferred
 * FKs and `patches/`, as `docker/db-init/init-postgres.sh` does) with the
 * terminology seed, and an owner that is superuser: fixture rows are loaded
 * with `session_replication_role = replica` so their unrelated parents need
 * not exist. What the services under test write runs as a runtime role
 * (LOGIN, NOBYPASSRLS, member of `mantra_app`) under forced RLS, with every FK.
 */
export const OWNER = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD ?? 'mantra',
};

export const ENTITIES = [
  CatalogConcepts,
  Conditions,
  ConditionsHistory,
  DiagnosticReports,
  DiagnosticReleaseEvents,
  DiagnosticReportFiles,
  DiagnosticReportResults,
  DiagnosticReportVersions,
  EncounterParticipants,
  Encounters,
  FileVersions,
  Files,
  ObservationReferenceRanges,
  Observations,
  PersonAccountLinks,
  PractitionerSpecialties,
  Referrals,
  ServiceRequests,
];

type Column = { name: string; type: string; max: number | null };

/** Inserts rows as the owner, filling NOT NULL columns it was not given. */
export class Seeder {
  private readonly columns = new Map<string, Column[]>();
  private readonly inserted: { table: string; key: string; id: string }[] = [];
  private n = 0;

  constructor(
    readonly owner: pg.Client,
    private readonly mark: string,
  ) {}

  /** Applies a versioned patch of `database/SQL/patches` (all are idempotent). */
  async patch(name: string): Promise<void> {
    const dir = join(process.cwd(), 'database', 'SQL', 'patches');
    await this.owner.query(readFileSync(join(dir, name), 'utf8'));
  }

  /** One row; `key` is the primary key column (default `id`). */
  async row(
    table: string,
    values: Record<string, unknown>,
    key = 'id',
  ): Promise<string> {
    const row: Record<string, unknown> = { [key]: randomUUID(), ...values };
    for (const column of await this.required(table)) {
      if (row[column.name] === undefined) row[column.name] = this.fill(column);
    }
    const names = Object.keys(row);
    await this.asReplica(() =>
      this.owner.query(
        `insert into ${table} (${names.map((c) => `"${c}"`).join(', ')}) values (${names.map((_, i) => `$${i + 1}`).join(', ')})`,
        names.map((c) => row[c]),
      ),
    );
    this.inserted.push({ table, key, id: row[key] as string });
    return row[key] as string;
  }

  /** Deletes what this suite inserted and what the services wrote under its ids. */
  async cleanup(extra: { table: string; key: string; id: string }[] = []) {
    await this.asReplica(async () => {
      for (const { table, key, id } of [...extra, ...this.inserted].reverse()) {
        await this.owner.query(`delete from ${table} where "${key}" = $1`, [
          id,
        ]);
      }
    });
  }

  private async asReplica<T>(work: () => Promise<T>): Promise<T> {
    await this.owner.query('begin');
    try {
      await this.owner.query("set local session_replication_role = 'replica'");
      const out = await work();
      await this.owner.query('commit');
      return out;
    } catch (error) {
      await this.owner.query('rollback');
      throw error;
    }
  }

  private async required(table: string): Promise<Column[]> {
    const cached = this.columns.get(table);
    if (cached) return cached;
    const [schema, name] = table.split('.');
    const { rows } = await this.owner.query<{
      column_name: string;
      data_type: string;
      character_maximum_length: number | null;
    }>(
      `select column_name, data_type, character_maximum_length
         from information_schema.columns
        where table_schema = $1 and table_name = $2
          and is_nullable = 'NO' and column_default is null`,
      [schema, name],
    );
    const columns = rows.map((r) => ({
      name: r.column_name,
      type: r.data_type,
      max: r.character_maximum_length,
    }));
    this.columns.set(table, columns);
    return columns;
  }

  private fill(column: Column): unknown {
    if (column.type === 'uuid') return randomUUID();
    if (column.type.startsWith('timestamp')) return new Date();
    if (column.type === 'date') return '2026-01-01';
    if (column.type === 'boolean') return false;
    if (/int|numeric/.test(column.type)) return 1;
    if (column.type.startsWith('json')) return '{}';
    const text = `${this.mark}-${(this.n += 1)}`;
    return column.max ? text.slice(-column.max) : text;
  }
}

/** Creates a throwaway runtime role and an ORM that connects as it. */
export async function runtimeOrm(
  owner: pg.Client,
  entities: unknown[] = ENTITIES,
): Promise<{ orm: MikroORM; drop: () => Promise<void> }> {
  const role = `int_rls_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
  const password = randomUUID();
  await owner.query(
    `create role ${role} login inherit nosuperuser nobypassrls password '${password}' in role mantra_app`,
  );
  process.env.DB_APP_USER = role;
  process.env.DB_APP_PASSWORD = password;
  // Variable paths: a relative `import()` without extension does not resolve under nodenext.
  const configPath: string = '../../src/orm/config/orm.config';
  const envPath: string = '../../src/orm/config/orm.env';
  const { buildOrmConfig } = (await import(
    configPath
  )) as typeof import('../../src/orm/config/orm.config');
  const { loadOrmEnv } = (await import(
    envPath
  )) as typeof import('../../src/orm/config/orm.env');
  const orm = await MikroORM.init({
    ...buildOrmConfig(
      loadOrmEnv({
        DB_HOST: OWNER.host,
        DB_PORT: String(OWNER.port),
        DB_NAME: OWNER.database,
        DB_USER: OWNER.user,
        DB_PASSWORD: OWNER.password,
        DB_APP_USER: role,
        DB_APP_PASSWORD: password,
      }),
    ),
    entities: entities as typeof ENTITIES,
    entitiesTs: [],
    metadataProvider: ReflectMetadataProvider,
    metadataCache: { enabled: false },
    discovery: { warnWhenNoEntities: false },
  });
  return {
    orm,
    drop: async () => {
      await orm.close(true);
      await owner.query(`drop role if exists ${role}`);
    },
  };
}

/** What `TenantContextInterceptor` does with RLS_ENFORCE=true: one transaction per request. */
export function asTenant<T>(
  orm: MikroORM,
  tenantId: string,
  work: (tx: EntityManager) => Promise<T>,
): Promise<T> {
  return runWithTenant(tenantId, () =>
    orm.em.transactional(async (tx) => {
      await applyTenantRls(tx, tenantId);
      return work(tx);
    }),
  );
}

/** The rejection of `promise`, to assert on its status and reason. */
export async function rejectionOf(
  promise: Promise<unknown>,
): Promise<{ getStatus(): number; reason?: string }> {
  const error = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  if (!error) throw new Error('expected a rejection');
  return error as { getStatus(): number; reason?: string };
}
