import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

/**
 * Verificación REAL de Row Level Security por tenant contra la base de datos.
 *
 * Aplica `database/SQL/patches/2026-08-05_tenant_rls.sql` (crea el rol
 * `mantra_app` sin BYPASSRLS, otorga privilegios y activa las políticas en
 * todas las tablas con `tenant_id`) y, para la custodia clínica (MCH-002),
 * `database/SQL/patches/2026-09-19_v4219_custodian_tenant_rls.sql`
 * (`custodian_tenant_id`, en las tablas que no tienen `tenant_id`).
 * Demuestra, conectado COMO `mantra_app`, que:
 *   1. Con `app.current_tenant_id` fijado a un tenant, sólo se ven sus filas.
 *   2. Insertar una fila de otro tenant se rechaza (WITH CHECK).
 *   3. Sin el GUC fijado, la política falla cerrada (cero filas).
 *   4. La elevación SYSTEM explícita puede barrer todos los tenants.
 *   5. RLS quedó activado en las tablas reales con `tenant_id`.
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
const BOOTSTRAP_LOCAL_ROLE = process.env.RLS_TEST_BOOTSTRAP_LOCAL_ROLE === '1';
const APP = {
  ...ADMIN,
  user: process.env.DB_APP_USER ?? 'mantra_app',
  password:
    process.env.DB_APP_PASSWORD ??
    (BOOTSTRAP_LOCAL_ROLE ? 'mantra_app_dev' : undefined),
};

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

// Opt-in: esta prueba APLICA la migración de RLS (crea el rol `mantra_app`, activa
// RLS en las ~284 tablas con `tenant_id`). Es una mutación de esquema irreversible,
// así que no corre por defecto: ejecútala con `RLS_TEST=1 yarn test:integration`
// tras decidir aplicar RLS en este entorno.
//
// El opt-in se mantiene a propósito, pero ya NO es lo que sostiene el aislamiento:
// cubre la capa de base (defensa en profundidad). El aislamiento de aplicación
// —que el tenant lo fije el actor y no el cuerpo de la petición— lo hace cumplir
// `TenantContextInterceptor` y está cubierto sin base por
// `src/common/tenant/tenant-context.interceptor.spec.ts`. Antes de eso, esta
// prueba apagada era la única evidencia del P0, que es tanto como no tener ninguna.
const describeRls = process.env.RLS_TEST === '1' ? describe : describe.skip;

describeRls('RLS de aislamiento por tenant (DB real)', () => {
  let admin: pg.Client;

  beforeAll(async () => {
    admin = new pg.Client(ADMIN);
    await admin.connect();

    // Aplica la política de RLS (idempotente). Vive en `SQL/patches/` de la raíz
    // del workspace —fuera de `apply_all.sql`— porque no se deriva de los
    // `.puml`. Ver `docs/architecture/ddl-sources.md`.
    // La copia versionada de este repositorio (`database/SQL/patches/`) es la
    // que corre en CI y en cualquier checkout sin el árbol externo
    // `../SQL` —que no existe fuera de esta máquina de desarrollo—, y ya
    // incorpora las correcciones de `current_user` y TimescaleDB (ver el
    // encabezado del propio archivo). Antes esta prueba sólo podía correr con
    // ese árbol externo al lado.
    const sql = readFileSync(
      join(
        process.cwd(),
        'database',
        'SQL',
        'patches',
        '2026-08-05_tenant_rls.sql',
      ),
      'utf8',
    );
    await admin.query(sql);

    // MCH-002: la política por `tenant_id` no cubre `custodian_tenant_id`
    // (custodia clínica). Este SÍ vive versionado en este repo —no en el árbol
    // externo `../SQL`— porque nace acá, no en la reconciliación de v4.0.9.
    const custodianSql = readFileSync(
      join(
        process.cwd(),
        'database',
        'SQL',
        'patches',
        '2026-09-19_v4219_custodian_tenant_rls.sql',
      ),
      'utf8',
    );
    await admin.query(custodianSql);

    if (!APP.password) {
      throw new Error(
        'Defina DB_APP_PASSWORD o use RLS_TEST_BOOTSTRAP_LOCAL_ROLE=1 sólo en una base local desechable',
      );
    }
    if (BOOTSTRAP_LOCAL_ROLE) {
      await admin.query(
        "ALTER ROLE mantra_app LOGIN PASSWORD 'mantra_app_dev'",
      );
    }

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
        USING (tenant_id = NULLIF(
          current_setting('app.current_tenant_id', true), ''
        )::uuid OR current_setting('app.system_context', true) = 'true')
        WITH CHECK (tenant_id = NULLIF(
          current_setting('app.current_tenant_id', true), ''
        )::uuid OR current_setting('app.system_context', true) = 'true')
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

    // Tabla-sonda con la política de custodia clínica (MCH-002): misma
    // técnica que `rls_probe`, con `custodian_tenant_id` en vez de `tenant_id`
    // — prueba el mecanismo que el patch v4.2.19 aplica a las 28 tablas reales.
    await admin.query('DROP TABLE IF EXISTS public.rls_custodian_probe');
    await admin.query(
      'CREATE TABLE public.rls_custodian_probe (id serial primary key, custodian_tenant_id uuid not null, label text)',
    );
    await admin.query(
      'ALTER TABLE public.rls_custodian_probe ENABLE ROW LEVEL SECURITY',
    );
    await admin.query(
      'ALTER TABLE public.rls_custodian_probe FORCE ROW LEVEL SECURITY',
    );
    await admin.query(
      'DROP POLICY IF EXISTS custodian_tenant_isolation ON public.rls_custodian_probe',
    );
    await admin.query(`
      CREATE POLICY custodian_tenant_isolation ON public.rls_custodian_probe
        USING (custodian_tenant_id = NULLIF(
          current_setting('app.current_tenant_id', true), ''
        )::uuid OR current_setting('app.system_context', true) = 'true')
        WITH CHECK (custodian_tenant_id = NULLIF(
          current_setting('app.current_tenant_id', true), ''
        )::uuid OR current_setting('app.system_context', true) = 'true')
    `);
    await admin.query(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.rls_custodian_probe TO mantra_app',
    );
    await admin.query(
      'GRANT USAGE, SELECT ON SEQUENCE public.rls_custodian_probe_id_seq TO mantra_app',
    );
    await admin.query('TRUNCATE public.rls_custodian_probe');
    await admin.query(
      'INSERT INTO public.rls_custodian_probe (custodian_tenant_id, label) VALUES ($1,$2),($3,$4)',
      [TENANT_A, 'custodia-A', TENANT_B, 'custodia-B'],
    );
  }, 120000);

  afterAll(async () => {
    if (admin) {
      await admin
        .query('DROP TABLE IF EXISTS public.rls_probe')
        .catch(() => undefined);
      await admin
        .query('DROP TABLE IF EXISTS public.rls_custodian_probe')
        .catch(() => undefined);
      if (BOOTSTRAP_LOCAL_ROLE) {
        await admin
          .query('ALTER ROLE mantra_app NOLOGIN')
          .catch(() => undefined);
      }
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

  it('sin GUC fijado la política falla cerrada', async () => {
    const app = new pg.Client(APP);
    await app.connect();
    try {
      const { rows } = await app.query(
        'SELECT count(*)::int AS n FROM public.rls_probe',
      );
      expect(rows[0].n).toBe(0);
    } finally {
      await app.end();
    }
  });

  it('el contexto SYSTEM explícito puede barrer todos los tenants', async () => {
    const app = new pg.Client(APP);
    await app.connect();
    try {
      await app.query("SELECT set_config('app.system_context', 'true', false)");
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

  // MCH-002: mismos cinco comportamientos, para la custodia clínica.
  describe('custodia clínica por custodian_tenant_id (MCH-002)', () => {
    it('con tenant A fijado, mantra_app sólo ve custodias de A', async () => {
      const app = new pg.Client(APP);
      await app.connect();
      try {
        await app.query(
          "SELECT set_config('app.current_tenant_id', $1, false)",
          [TENANT_A],
        );
        const { rows } = await app.query(
          'SELECT custodian_tenant_id, label FROM public.rls_custodian_probe',
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].custodian_tenant_id).toBe(TENANT_A);
      } finally {
        await app.end();
      }
    });

    it('mantra_app NO puede insertar una fila custodiada por otro tenant (WITH CHECK)', async () => {
      const app = new pg.Client(APP);
      await app.connect();
      try {
        await app.query(
          "SELECT set_config('app.current_tenant_id', $1, false)",
          [TENANT_A],
        );
        await expect(
          app.query(
            'INSERT INTO public.rls_custodian_probe (custodian_tenant_id, label) VALUES ($1,$2)',
            [TENANT_B, 'intruso'],
          ),
        ).rejects.toThrow(/row-level security|violates/i);
      } finally {
        await app.end();
      }
    });

    it('sin GUC fijado, ninguna fila de custodia es visible', async () => {
      // Una conexión nueva del pool: nada hereda el tenant de la prueba
      // anterior, que es exactamente lo que este caso comprueba.
      const app = new pg.Client(APP);
      await app.connect();
      try {
        const { rows } = await app.query(
          'SELECT count(*)::int AS n FROM public.rls_custodian_probe',
        );
        expect(rows[0].n).toBe(0);
      } finally {
        await app.end();
      }
    });

    it('el contexto SYSTEM explícito puede barrer todas las custodias', async () => {
      const app = new pg.Client(APP);
      await app.connect();
      try {
        await app.query(
          "SELECT set_config('app.system_context', 'true', false)",
        );
        const { rows } = await app.query(
          'SELECT count(*)::int AS n FROM public.rls_custodian_probe',
        );
        expect(rows[0].n).toBe(2);
      } finally {
        await app.end();
      }
    });

    // AC3 de MCH-002: toda tabla con custodian_tenant_id tiene su política.
    // Agregar una tabla así sin volver a aplicar el patch v4.2.19 hace fallar
    // este caso — es la comprobación de cobertura que pide el hallazgo.
    it('toda tabla real con custodian_tenant_id uuid tiene su política aplicada', async () => {
      const { rows } = await admin.query(`
        select c.table_schema, c.table_name
        from information_schema.columns c
        join information_schema.tables t
          on t.table_schema = c.table_schema and t.table_name = c.table_name
         and t.table_type = 'BASE TABLE'
        left join pg_policies p
          on p.schemaname = c.table_schema and p.tablename = c.table_name
         and p.policyname = 'custodian_tenant_isolation'
        where c.column_name = 'custodian_tenant_id'
          and c.data_type = 'uuid'
          and c.table_schema not like 'pg_%'
          and c.table_schema not in ('information_schema')
          and c.table_schema not like '_timescaledb%'
          and c.table_schema not in ('timescaledb_information', 'timescaledb_experimental')
          and p.policyname is null
      `);
      expect(rows).toEqual([]);
    });

    it('las 28 tablas de custodia clínica reportadas por la auditoría tienen RLS forzado', async () => {
      const { rows } = await admin.query(`
        select count(*)::int as n
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        join pg_policies p
          on p.schemaname = n.nspname and p.tablename = c.relname
         and p.policyname = 'custodian_tenant_isolation'
        where c.relrowsecurity = true and c.relforcerowsecurity = true
          -- Excluye la tabla-sonda de esta misma prueba (public.rls_custodian_probe):
          -- lleva la misma política a propósito, pero no es una de las 28 tablas
          -- reales que reportó la auditoría.
          and n.nspname <> 'public'
      `);
      expect(rows[0].n).toBe(28);
    });
  });
});
