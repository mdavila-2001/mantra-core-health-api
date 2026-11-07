import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';
import {
  assertOwnDisposableDatabase,
  assertServerIdentity,
  isDisposableDatabaseName,
  resolveResetTarget,
} from './disposable-database';

/** A throwaway database (and app role) created for one suite run. */
export interface ScratchDb {
  readonly name: string;
  /** Superuser pool on the scratch database (setup and assertions). */
  readonly admin: pg.Pool;
  /** URL of the non-superuser role, so FORCE RLS applies. */
  readonly appUrl: string;
  dispose(): Promise<void>;
}

const PATCH = 'database/SQL/patches/2026-10-31_v4281_cargas_masivas.sql';

/**
 * Plain `DROP DATABASE`, retried while the server still reports the database in
 * use (55006): our pools have been ended but their sockets may close a moment
 * later. No `WITH (FORCE)`: killing live backends raced with the pool teardown.
 */
async function dropWhenFree(server: pg.Pool, name: string): Promise<void> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await server.query(`DROP DATABASE IF EXISTS "${name}"`);
      return;
    } catch (error) {
      if ((error as { code?: string }).code !== '55006' || attempt >= 50) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * Creates a fresh database on the server given by `DB_HOST`/`DB_PORT`/`DB_USER`/
 * `DB_PASSWORD`, applies the real bulk-import patch there and returns it. It
 * never runs DDL on the configured database: the only destructive statement is
 * `DROP DATABASE` of the uniquely named database this call created.
 *
 * Guards: `assertOwnDisposableDatabase` (local host + disposable name) runs
 * before connecting, and `assertServerIdentity` re-checks `current_database()`
 * on the scratch connection before any schema is written.
 */
export async function createScratchDb(
  env: NodeJS.ProcessEnv = process.env,
): Promise<ScratchDb> {
  const target = resolveResetTarget(env);
  const suffix = randomBytes(4).toString('hex');
  const name = `bulk_import_test_${suffix}`;
  const role = `bulk_it_app_${suffix}`;
  const password = randomBytes(12).toString('hex');
  assertOwnDisposableDatabase(target.host, name, env);

  const conn = (database: string) => ({
    host: target.host,
    port: target.port,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database,
  });
  const server = new pg.Pool(conn(target.database));
  let admin: pg.Pool | undefined;
  const dispose = async () => {
    await admin?.end();
    if (isDisposableDatabaseName(name)) await dropWhenFree(server, name);
    await server.query(`DROP ROLE IF EXISTS "${role}"`);
    await server.end();
  };
  try {
    await server.query(`CREATE DATABASE "${name}" TEMPLATE template0`);
    await server.query(`CREATE ROLE "${role}" LOGIN PASSWORD '${password}'`);
    admin = new pg.Pool(conn(name));
    const { rows } = await admin.query('SELECT current_database() AS db');
    assertServerIdentity(rows[0].db, { ...target, database: name });
    await admin.query(`
      CREATE SCHEMA directory; CREATE SCHEMA iam; CREATE SCHEMA delegated_access;
      CREATE SCHEMA system_ops;
      CREATE TABLE directory.tenants (id uuid PRIMARY KEY);
      CREATE TABLE iam.users (id uuid PRIMARY KEY);
      CREATE TABLE delegated_access.four_eyes_requests (id uuid PRIMARY KEY, tenant_id uuid NOT NULL);
    `);
    await admin.query(readFileSync(join(process.cwd(), PATCH), 'utf8'));
    await admin.query(`
      GRANT USAGE ON SCHEMA system_ops TO "${role}";
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA system_ops TO "${role}";
    `);
  } catch (error) {
    await dispose().catch(() => undefined);
    throw error;
  }
  const url = new URL(`postgres://${target.host}:${target.port}/${name}`);
  url.username = role;
  url.password = password;
  return { name, admin, appUrl: url.toString(), dispose };
}
