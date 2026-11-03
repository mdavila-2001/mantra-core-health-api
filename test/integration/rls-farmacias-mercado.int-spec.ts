import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

/**
 * FAR-C9 · H-01 — lectura acotada de las farmacias publicadas por el paciente
 * que navega el mercado, con RLS REAL sobre `pharmacy.pharmacies`.
 *
 * Aplica `2026-08-05_tenant_rls.sql` y `2026-11-03_v4286_farmacias_mercado_
 * lectura_paciente.sql` y demuestra, conectado COMO `mantra_app` (sin BYPASSRLS):
 *   1. Sin `app.marketplace_viewer`, un paciente de A sólo ve lo de A (nada cambia).
 *   2. Con el GUC, ve además las farmacias PUBLICADAS de otras organizaciones, y
 *      sólo esas: ni borradores ni sin verificar.
 *   3. Es de sólo lectura: UPDATE/DELETE afectan 0 filas y INSERT en otro tenant
 *      se rechaza (WITH CHECK).
 *   4. Un valor distinto de `true` no abre nada.
 *   5. No abre otras tablas con RLS: el outbox de otro tenant sigue invisible.
 *
 * Opt-in (`RLS_TEST=1`), igual que `rls.int-spec.ts`: aplica la migración de RLS
 * (crea el rol `mantra_app` y activa RLS en las tablas con `tenant_id`), y exige
 * el modelo base ya aplicado (`database/SQL/apply_all.sql`). Inserta y borra sólo
 * sus propias filas, con ids fijos.
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

const describeRls = process.env.RLS_TEST === '1' ? describe : describe.skip;

// A = el paciente; B publicada; C borrador; D sin verificar.
const TENANT_A = '11111111-1111-4111-8111-1111111111a1';
const TENANT_B = '22222222-2222-4222-8222-2222222222b2';
const TENANT_C = '33333333-3333-4333-8333-3333333333c3';
const TENANT_D = '44444444-4444-4444-8444-4444444444d4';
const TENANT_E = '55555555-5555-4555-8555-5555555555e5';

const CONCEPT = {
  active: 'c0a10000-0000-4000-8000-000000000001',
  draft: 'c0a10000-0000-4000-8000-000000000002',
  verified: 'c0a10000-0000-4000-8000-000000000003',
  pending: 'c0a10000-0000-4000-8000-000000000004',
};
const PHARMACY = {
  a: 'a0a10000-0000-4000-8000-0000000000a1',
  b: 'b0a10000-0000-4000-8000-0000000000b1',
  c: 'b0a10000-0000-4000-8000-0000000000b2',
  d: 'b0a10000-0000-4000-8000-0000000000b3',
};
const OUTBOX_B = 'b0a10000-0000-4000-8000-0000000000e1';
const DOMAIN_EVENT_B = 'b0a10000-0000-4000-8000-0000000000e2';
const CODES = ['H01-A', 'H01-B', 'H01-C', 'H01-D'];

describeRls(
  'RLS · farmacias publicadas para el paciente (H-01, DB real)',
  () => {
    let admin: pg.Client;
    let app: pg.Client;

    /** Ejecuta `work` como `mantra_app`, en una transacción que siempre se revierte. */
    async function asApp<T>(
      gucs: Record<string, string>,
      work: () => Promise<T>,
    ): Promise<T> {
      await app.query('BEGIN');
      try {
        for (const [key, value] of Object.entries(gucs)) {
          await app.query('SELECT set_config($1, $2, true)', [key, value]);
        }
        return await work();
      } finally {
        await app.query('ROLLBACK');
      }
    }

    const visibleCodes = async () =>
      (
        await app.query<{ code: string }>(
          'SELECT code FROM pharmacy.pharmacies WHERE code = ANY($1) ORDER BY code',
          [CODES],
        )
      ).rows.map((row) => row.code);

    async function cleanup(): Promise<void> {
      await admin.query('DELETE FROM messaging.outbox_messages WHERE id = $1', [
        OUTBOX_B,
      ]);
      await admin.query('DELETE FROM messaging.domain_events WHERE id = $1', [
        DOMAIN_EVENT_B,
      ]);
      await admin.query(
        'DELETE FROM pharmacy.pharmacies WHERE code = ANY($1)',
        [CODES],
      );
      await admin.query(
        'DELETE FROM terminology.catalog_concepts WHERE id = ANY($1)',
        [Object.values(CONCEPT)],
      );
    }

    beforeAll(async () => {
      if (!APP.password) {
        throw new Error(
          'Defina DB_APP_PASSWORD o use RLS_TEST_BOOTSTRAP_LOCAL_ROLE=1 sólo en una base local desechable',
        );
      }
      admin = new pg.Client(ADMIN);
      await admin.connect();
      const patches = join(process.cwd(), 'database', 'SQL', 'patches');
      await admin.query(
        readFileSync(join(patches, '2026-08-05_tenant_rls.sql'), 'utf8'),
      );
      await admin.query(
        readFileSync(
          join(
            patches,
            '2026-11-03_v4286_farmacias_mercado_lectura_paciente.sql',
          ),
          'utf8',
        ),
      );
      if (BOOTSTRAP_LOCAL_ROLE) {
        await admin.query(
          "ALTER ROLE mantra_app LOGIN PASSWORD 'mantra_app_dev'",
        );
      }

      await cleanup();
      // Superusuario: sin disparadores de FK, así que no hace falta sembrar
      // organizaciones, versiones de catálogo ni nada ajeno a lo que se prueba.
      await admin.query('BEGIN');
      await admin.query("SET LOCAL session_replication_role = 'replica'");
      await admin.query(
        `INSERT INTO terminology.catalog_concepts
         (id, code_system_version_id, code, display, created_at, updated_at)
       VALUES
         ($1, $5, 'PHARM_PHARMACY_ACTIVE', 'activa', now(), now()),
         ($2, $5, 'PHARM_PHARMACY_DRAFT', 'borrador', now(), now()),
         ($3, $5, 'PHARM_VERIFICATION_VERIFIED', 'verificada', now(), now()),
         ($4, $5, 'PHARM_VERIFICATION_PENDING', 'pendiente', now(), now())`,
        [
          CONCEPT.active,
          CONCEPT.draft,
          CONCEPT.verified,
          CONCEPT.pending,
          'c0a10000-0000-4000-8000-0000000000ff',
        ],
      );
      const pharmacy = (
        id: string,
        tenant: string,
        code: string,
        status: string,
        verification: string,
      ) =>
        admin.query(
          `INSERT INTO pharmacy.pharmacies
           (id, tenant_id, code, legal_name, verification_status_concept_id,
            status_concept_id, created_at, updated_at)
         VALUES ($1, $2, $3, $3, $4, $5, now(), now())`,
          [id, tenant, code, verification, status],
        );
      await pharmacy(
        PHARMACY.a,
        TENANT_A,
        'H01-A',
        CONCEPT.active,
        CONCEPT.verified,
      );
      await pharmacy(
        PHARMACY.b,
        TENANT_B,
        'H01-B',
        CONCEPT.active,
        CONCEPT.verified,
      );
      await pharmacy(
        PHARMACY.c,
        TENANT_C,
        'H01-C',
        CONCEPT.draft,
        CONCEPT.verified,
      );
      await pharmacy(
        PHARMACY.d,
        TENANT_D,
        'H01-D',
        CONCEPT.active,
        CONCEPT.pending,
      );
      // Un evento de outbox de B: la mensajería no se abre con el GUC.
      await admin.query(
        `INSERT INTO messaging.domain_events
         (id, tenant_id, event_type, event_version, aggregate_type, aggregate_id,
          payload_json, correlation_id, occurred_at, recorded_at)
       VALUES ($1::uuid, $2, 'H01Probe', 1, 'probe', $1::uuid, '{}'::jsonb, $1::uuid, now(), now())`,
        [DOMAIN_EVENT_B, TENANT_B],
      );
      await admin.query(
        `INSERT INTO messaging.outbox_messages
         (id, tenant_id, domain_event_id, aggregate_type, aggregate_id,
          idempotency_key, payload_json, status_concept_id, attempts,
          max_attempts, created_at, updated_at)
       VALUES ($1::uuid, $2, $3, 'probe', $1::uuid, 'h01-probe', '{}'::jsonb, $4, 0, 1,
               now(), now())`,
        [OUTBOX_B, TENANT_B, DOMAIN_EVENT_B, CONCEPT.active],
      );
      await admin.query('COMMIT');

      app = new pg.Client(APP);
      await app.connect();
    });

    afterAll(async () => {
      await app?.end();
      if (admin) {
        await cleanup();
        await admin.end();
      }
    });

    it('sin el GUC, el paciente de A sólo ve lo de A', async () => {
      expect(
        await asApp({ 'app.current_tenant_id': TENANT_A }, visibleCodes),
      ).toEqual(['H01-A']);
    });

    it('con el GUC, ve además las publicadas de otras organizaciones, y sólo esas', async () => {
      const seen = await asApp(
        { 'app.current_tenant_id': TENANT_A, 'app.marketplace_viewer': 'true' },
        visibleCodes,
      );
      expect(seen).toEqual(['H01-A', 'H01-B']);
      // Negativos de aislamiento: borrador (C) y sin verificar (D) no existen.
      expect(seen).not.toContain('H01-C');
      expect(seen).not.toContain('H01-D');
    });

    it('un valor distinto de «true» no abre nada', async () => {
      for (const value of ['false', '', 'TRUE', '1', 'yes']) {
        expect(
          await asApp(
            {
              'app.current_tenant_id': TENANT_A,
              'app.marketplace_viewer': value,
            },
            visibleCodes,
          ),
        ).toEqual(['H01-A']);
      }
    });

    it('es de sólo lectura: UPDATE y DELETE sobre la farmacia ajena afectan 0 filas', async () => {
      await asApp(
        { 'app.current_tenant_id': TENANT_A, 'app.marketplace_viewer': 'true' },
        async () => {
          const update = await app.query(
            "UPDATE pharmacy.pharmacies SET trade_name = 'hack' WHERE code = 'H01-B'",
          );
          const remove = await app.query(
            "DELETE FROM pharmacy.pharmacies WHERE code = 'H01-B'",
          );
          expect(update.rowCount).toBe(0);
          expect(remove.rowCount).toBe(0);
        },
      );
      const intact = await admin.query(
        "SELECT trade_name FROM pharmacy.pharmacies WHERE code = 'H01-B'",
      );
      expect(intact.rows[0].trade_name).toBeNull();
    });

    it('no permite crear una farmacia en otro tenant, ni con el GUC', async () => {
      await expect(
        asApp(
          {
            'app.current_tenant_id': TENANT_A,
            'app.marketplace_viewer': 'true',
          },
          () =>
            app.query(
              `INSERT INTO pharmacy.pharmacies
               (id, tenant_id, code, legal_name, verification_status_concept_id,
                status_concept_id, created_at, updated_at)
             VALUES ('b0a10000-0000-4000-8000-0000000000b9', $1, 'H01-X', 'x', $2, $3, now(), now())`,
              [TENANT_E, CONCEPT.verified, CONCEPT.active],
            ),
        ),
      ).rejects.toThrow(/row-level security/i);
    });

    it('no abre otras tablas con RLS: el outbox de otro tenant sigue invisible', async () => {
      const outbox = await asApp(
        { 'app.current_tenant_id': TENANT_A, 'app.marketplace_viewer': 'true' },
        () =>
          app.query('SELECT id FROM messaging.outbox_messages WHERE id = $1', [
            OUTBOX_B,
          ]),
      );
      expect(outbox.rowCount).toBe(0);
      const events = await asApp(
        { 'app.current_tenant_id': TENANT_A, 'app.marketplace_viewer': 'true' },
        () =>
          app.query('SELECT id FROM messaging.domain_events WHERE id = $1', [
            DOMAIN_EVENT_B,
          ]),
      );
      expect(events.rowCount).toBe(0);
    });

    it('la política existe una sola vez y es de lectura', async () => {
      const policies = await admin.query<{ cmd: string }>(
        `SELECT cmd FROM pg_policies
        WHERE schemaname = 'pharmacy' AND tablename = 'pharmacies'
          AND policyname = 'pharmacies_marketplace_read'`,
      );
      expect(policies.rows).toEqual([{ cmd: 'SELECT' }]);
    });
  },
);
