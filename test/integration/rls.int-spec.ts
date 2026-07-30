import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

/**
 * Verificación REAL de Row Level Security por tenant contra la base de datos.
 *
 * Aplica `database/SQL/99_rls/01_tenant_rls.sql` (crea el rol `mantra_app` sin
 * BYPASSRLS, otorga privilegios y activa las políticas en todas las tablas con
 * `tenant_id`) y demuestra, conectado COMO `mantra_app`, que:
 *   1. Con `app.current_tenant_id` fijado a un tenant, sólo se ven sus filas.
 *   2. Insertar una fila de otro tenant se rechaza (WITH CHECK).
 *   3. Sin el GUC fijado, la política es permisiva (contexto de sistema).
 *   4. RLS quedó activado en las tablas reales con `tenant_id`.
 *
 * La prueba usa una tabla-sonda con la MISMA política que la migración aplica a
 * las 284 tablas reales, así que prueba el mecanismo (GUC + FORCE + rol no
 * privilegiado) que protege a todas ellas.
 */
const ADMIN = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5434),
  user: process.env.DB_USER ?? 'mantra',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? 'mantra_redesa_health',
};
const APP = { ...ADMIN, user: 'mantra_app', password: 'mantra_app_dev' };

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

// Opt-in: esta prueba APLICA la migración de RLS (crea el rol `mantra_app`, activa
// RLS en las ~284 tablas con `tenant_id`). Es una mutación de esquema irreversible,
// así que no corre por defecto: ejecútala con `RLS_TEST=1 yarn test:integration`
// tras decidir aplicar RLS en este entorno.
const describeRls = process.env.RLS_TEST === '1' ? describe : describe.skip;

describeRls('RLS de aislamiento por tenant (DB real)', () => {
  let admin: pg.Client;

  beforeAll(async () => {
    admin = new pg.Client(ADMIN);
    await admin.connect();

    // Aplica la migración de RLS (idempotente).
    const sql = readFileSync(
      join(process.cwd(), 'database/SQL/99_rls/01_tenant_rls.sql'),
      'utf8',
    );
    await admin.query(sql);

    // Tabla-sonda con la misma política que la migración.
    await admin.query('DROP TABLE IF EXISTS public.rls_probe');
    await admin.query(
      'CREATE TABLE public.rls_probe (id serial primary key, tenant_id uuid not null, label text)',
    );
    await admin.query('ALTER TABLE public.rls_probe ENABLE ROW LEVEL SECURITY');
    await admin.query('ALTER TABLE public.rls_probe FORCE ROW LEVEL SECURITY');
    await admin.query(
      'DROP POLICY IF EXISTS tenant_isolation ON public.rls_probe',
    );
    await admin.query(`
      CREATE POLICY tenant_isolation ON public.rls_probe
        USING (current_setting('app.current_tenant_id', true) IS NULL
          OR current_setting('app.current_tenant_id', true) = ''
          OR tenant_id = current_setting('app.current_tenant_id', true)::uuid)
        WITH CHECK (current_setting('app.current_tenant_id', true) IS NULL
          OR current_setting('app.current_tenant_id', true) = ''
          OR tenant_id = current_setting('app.current_tenant_id', true)::uuid)
    `);
    await admin.query(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.rls_probe TO mantra_app',
    );
    await admin.query(
      'GRANT USAGE, SELECT ON SEQUENCE public.rls_probe_id_seq TO mantra_app',
    );
    // Semilla: una fila por tenant (admin es superusuario y omite RLS).
    await admin.query('TRUNCATE public.rls_probe');
    await admin.query(
      'INSERT INTO public.rls_probe (tenant_id, label) VALUES ($1,$2),($3,$4)',
      [TENANT_A, 'de-tenant-A', TENANT_B, 'de-tenant-B'],
    );
  }, 120000);

  afterAll(async () => {
    if (admin) {
      await admin
        .query('DROP TABLE IF EXISTS public.rls_probe')
        .catch(() => undefined);
      await admin.end();
    }
  });

  it('el rol de app NO es superusuario ni bypassrls', async () => {
    const { rows } = await admin.query(
      "select rolsuper, rolbypassrls from pg_roles where rolname='mantra_app'",
    );
    expect(rows[0].rolsuper).toBe(false);
    expect(rows[0].rolbypassrls).toBe(false);
  });

  it('con tenant A fijado, mantra_app sólo ve filas de A', async () => {
    const app = new pg.Client(APP);
    await app.connect();
    try {
      await app.query("SELECT set_config('app.current_tenant_id', $1, false)", [
        TENANT_A,
      ]);
      const { rows } = await app.query(
        'SELECT tenant_id, label FROM public.rls_probe',
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].tenant_id).toBe(TENANT_A);
    } finally {
      await app.end();
    }
  });

  it('mantra_app NO puede insertar una fila de otro tenant (WITH CHECK)', async () => {
    const app = new pg.Client(APP);
    await app.connect();
    try {
      await app.query("SELECT set_config('app.current_tenant_id', $1, false)", [
        TENANT_A,
      ]);
      await expect(
        app.query(
          'INSERT INTO public.rls_probe (tenant_id, label) VALUES ($1,$2)',
          [TENANT_B, 'intruso'],
        ),
      ).rejects.toThrow(/row-level security|violates/i);
    } finally {
      await app.end();
    }
  });

  it('sin GUC fijado la política es permisiva (contexto de sistema)', async () => {
    const app = new pg.Client(APP);
    await app.connect();
    try {
      const { rows } = await app.query(
        'SELECT count(*)::int AS n FROM public.rls_probe',
      );
      expect(rows[0].n).toBe(2);
    } finally {
      await app.end();
    }
  });

  it('RLS quedó activado en las tablas reales con tenant_id', async () => {
    const { rows } = await admin.query(`
      select count(*)::int as n
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where c.relrowsecurity = true and c.relforcerowsecurity = true
    `);
    expect(rows[0].n).toBeGreaterThan(200);
  });
});
