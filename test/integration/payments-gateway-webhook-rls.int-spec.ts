import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Client } from 'pg';
import { CONCEPTS } from '../../src/common';
import { PaymentCheckoutSessions } from '../../src/modules/payments/entities/payment_checkout_sessions.entity';
import { PaymentDebts } from '../../src/modules/payments/entities/payment_debts.entity';
import { PaymentIntents } from '../../src/modules/payments/entities/payment_intents.entity';
import { PaymentWebhookEvents } from '../../src/modules/payments/entities/payment_webhook_events.entity';
import {
  PaymentFlowRepository,
  PaymentIntentsRepository,
  PaymentTransactionsRepository,
} from '../../src/modules/payments/repositories';
import { PaymentsGatewayWebhookService } from '../../src/modules/payments/services/payments-gateway-webhook.service';
import type { PaymentsGatewayConfig } from '../../src/modules/payments/gateway/payments-gateway.env';
import {
  TEST_API_KEY,
  TEST_WEBHOOK_SECRET,
  signTestWebhook,
} from '../../src/modules/payments/gateway/payments-gateway.double.testing';

/**
 * El receptor público de webhooks BAJO RLS, con un rol de aplicación REAL
 * (`NOSUPERUSER NOBYPASSRLS`) sobre una base descartable (hallazgo B1 de la
 * revisión del carril INT).
 *
 * `POST /payments/gateway-webhooks` es `@Public()`: el `TenantContextInterceptor`
 * no fija `app.current_tenant_id` y la política `tenant_isolation` es fail-closed,
 * así que sin una resolución propia del tenant el rol de aplicación ve 0 filas:
 * cada `succeeded` firmado daba 404 y la intención quedaba `PI_PENDING` para
 * siempre. Esta prueba ejerce el servicio y los repositorios REALES con la
 * política copiada TEXTUAL de `database/SQL/patches/2026-08-05_tenant_rls.sql`
 * (extraída por expresión regular, no reescrita) y un rol sujeto a ella. El otro
 * int-spec del receptor se conecta como superusuario y por eso no lo veía.
 *
 * NO levanta `AppModule`. Crea una base NUEVA y un rol NUEVOS en el Postgres de
 * DESARROLLO de la pasarela (127.0.0.1:54321) y los borra al terminar. Sólo se
 * aplican las tablas que el receptor toca; las claves foráneas hacia tablas que
 * no se crean no se aplican (límite declarado); las filas usan UUID sintéticos.
 *
 * Para correrla (opt-in explícito):
 *   PAYMENTS_WEBHOOK_IT=local-throwaway-db \
 *   node --experimental-vm-modules node_modules/jest-cli/bin/jest.js \
 *     --config test/jest-integration.json payments-gateway-webhook-rls
 */

const OPT_IN = process.env.PAYMENTS_WEBHOOK_IT === 'local-throwaway-db';
const describeIt = OPT_IN ? describe : describe.skip;

const PG = {
  host: process.env.PAYMENTS_WEBHOOK_IT_HOST ?? '127.0.0.1',
  port: Number(process.env.PAYMENTS_WEBHOOK_IT_PORT ?? 54321),
  user: process.env.PAYMENTS_WEBHOOK_IT_USER ?? 'postgres',
  password: process.env.PAYMENTS_WEBHOOK_IT_PASSWORD ?? 'pay',
};
const SUFFIX = randomBytes(5).toString('hex');
const DB_NAME = `mantra_it_whk_rls_${SUFFIX}`;
const APP_ROLE = `mantra_it_app_${SUFFIX}`;
// Credencial de un rol que sólo existe mientras dura esta corrida, en una base descartable.
const APP_PASSWORD = randomBytes(12).toString('hex');
const TABLES = [
  'payment_gateways',
  'payment_intents',
  'payment_debts',
  'payment_checkout_sessions',
  'payment_webhook_events',
] as const;
/** Tablas del receptor que llevan `tenant_id`: las que la política RLS cubre. */
const RLS_TABLES = [
  'payment_intents',
  'payment_debts',
  'payment_checkout_sessions',
] as const;

const DDL_DIR = join(process.cwd(), 'database', 'SQL', '42_payments');
const ddl = (file: string) => readFileSync(join(DDL_DIR, file), 'utf8');

/** Cuerpo de la política `tenant_isolation` tal como la define el parche real. */
function realPolicyBody(): string {
  const patch = readFileSync(
    join(
      process.cwd(),
      'database',
      'SQL',
      'patches',
      '2026-08-05_tenant_rls.sql',
    ),
    'utf8',
  );
  const match = patch.match(
    /CREATE POLICY tenant_isolation ON %I\.%I([\s\S]*?)\$pol\$/u,
  );
  if (!match) throw new Error('No se encontró la política en el parche real');
  return match[1];
}

describeIt('Receptor de webhooks bajo RLS con un rol NOBYPASSRLS', () => {
  let admin: Client;
  let su: Client;
  let app: MikroORM;
  let service: PaymentsGatewayWebhookService;

  const config: PaymentsGatewayConfig = {
    viaGateway: true,
    baseUrl: 'https://sandbox.pay.example/v1',
    apiKey: TEST_API_KEY,
    mode: 'test',
    webhookSecrets: [TEST_WEBHOOK_SECRET],
    webhookPublicKeys: [],
    webhookToleranceSeconds: 300,
    timeoutMs: 1000,
    maxAttempts: 3,
    retryBaseMs: 10,
  };
  const logger = {
    setContext: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  };

  const q = async <T = Record<string, any>>(
    sql: string,
    params: unknown[] = [],
  ) => (await su.query(sql, params)).rows as T[];

  beforeAll(async () => {
    admin = new Client({ ...PG, database: 'postgres' });
    await admin.connect();
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);
    su = new Client({ ...PG, database: DB_NAME });
    await su.connect();

    await su.query(ddl('01_schema.sql'));
    for (const name of TABLES) {
      const statement = ddl('02_tables.sql').match(
        new RegExp(
          `CREATE TABLE IF NOT EXISTS "payments"\\."${name}" \\([\\s\\S]*?\\n\\);`,
        ),
      )?.[0];
      if (!statement) throw new Error(`Falta la tabla payments.${name}`);
      await su.query(statement);
    }
    for (const m of ddl('04_indexes.sql').matchAll(
      /CREATE (?:UNIQUE )?INDEX IF NOT EXISTS "[^"]+" ON "payments"\."(\w+)"[^;]*;/g,
    )) {
      if ((TABLES as readonly string[]).includes(m[1])) await su.query(m[0]);
    }

    await admin.query(
      `CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`,
    );
    await su.query(`GRANT USAGE ON SCHEMA payments TO ${APP_ROLE}`);
    await su.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA payments TO ${APP_ROLE}`,
    );
    const policy = realPolicyBody();
    for (const table of RLS_TABLES) {
      await su.query(`ALTER TABLE payments.${table} ENABLE ROW LEVEL SECURITY`);
      await su.query(`ALTER TABLE payments.${table} FORCE ROW LEVEL SECURITY`);
      await su.query(
        `CREATE POLICY tenant_isolation ON payments.${table}${policy}`,
      );
    }

    app = await MikroORM.init({
      host: PG.host,
      port: PG.port,
      user: APP_ROLE,
      password: APP_PASSWORD,
      dbName: DB_NAME,
      entities: [
        PaymentIntents,
        PaymentDebts,
        PaymentCheckoutSessions,
        PaymentWebhookEvents,
      ],
      metadataProvider: ReflectMetadataProvider,
      metadataCache: { enabled: false },
      allowGlobalContext: true,
      pool: { min: 0, max: 20 },
    });
    service = new PaymentsGatewayWebhookService(
      config,
      app.em as never,
      new PaymentIntentsRepository(),
      new PaymentFlowRepository(),
      new PaymentTransactionsRepository(),
      logger as never,
    );
  });

  afterAll(async () => {
    await app?.close(true);
    await su?.end();
    if (admin) {
      // El pool cierra sus sockets de forma asíncrona: terminar un backend que el
      // pool todavía conserva ocioso emite un error sin manejar. Se espera por
      // condición a que no quede ninguna conexión de esta base antes de tirarla.
      for (let i = 0; i < 100; i += 1) {
        const open = await admin.query(
          `select count(*)::int as n from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()`,
          [DB_NAME],
        );
        if (open.rows[0].n === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await admin.query(
        `select pg_terminate_backend(pid) from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()`,
        [DB_NAME],
      );
      await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
      await admin.query(`DROP ROLE IF EXISTS ${APP_ROLE}`);
      await admin.end();
    }
  });

  // ---------------------------------------------------------------- semillas
  let gatewayId: string;
  beforeAll(async () => {
    gatewayId = randomUUID();
    await q(
      `insert into payments.payment_gateways (id, code, name, gateway_type_concept_id, state_concept_id, created_at, updated_at)
       values ($1, $2, 'Pasarela de prueba (sintética)', $3, $4, now(), now())`,
      [gatewayId, `it-${gatewayId.slice(0, 8)}`, randomUUID(), randomUUID()],
    );
  });

  interface Seed {
    tenantId: string;
    intentId: string;
    ref: string;
    debtId: string;
    sessionId: string;
  }

  async function seedDebt(tenantId: string, outstanding = '150.000000') {
    const id = randomUUID();
    await q(
      `insert into payments.payment_debts
         (id, tenant_id, gateway_connection_id, debtor_business_partner_id, internal_debt_number, currency_code,
          total_amount, outstanding_amount, due_at, status_concept_id, created_at, updated_at)
       values ($1, $2, $3, $4, $5, 'BOB', '150.000000', $6, now() + interval '7 days', $7, now(), now())`,
      [
        id,
        tenantId,
        randomUUID(),
        randomUUID(),
        `D-${id.slice(0, 8)}`,
        outstanding,
        CONCEPTS.DEBT_IN_CHECKOUT,
      ],
    );
    return id;
  }

  async function seedIntent(
    tenantId: string,
    debtId: string,
    over: { ref?: string; amount?: string } = {},
  ) {
    const id = randomUUID();
    const ref = over.ref ?? `pi_${randomBytes(8).toString('hex')}`;
    await q(
      `insert into payments.payment_intents
         (id, tenant_id, gateway_id, purpose_concept_id, source_ref_type, source_ref_id, amount, currency_concept_id,
          idempotency_key, gateway_intent_ref, status_concept_id, created_at, updated_at)
       values ($1, $2, $3, $4, 'payment_debt', $5, $6, $7, $8, $9, $10, now(), now())`,
      [
        id,
        tenantId,
        gatewayId,
        CONCEPTS.PAY_PURPOSE_DEBT,
        debtId,
        over.amount ?? '150.00',
        CONCEPTS.CURRENCY_BOB,
        `it-${id}`,
        ref,
        CONCEPTS.PI_PENDING,
      ],
    );
    return { id, ref };
  }

  async function seedSession(
    tenantId: string,
    debtId: string,
    intentId: string,
  ) {
    const id = randomUUID();
    await q(
      `insert into payments.payment_checkout_sessions
         (id, tenant_id, gateway_connection_id, payment_debt_id, payment_intent_id, session_token_hash, redirect_url,
          expires_at, status_concept_id, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, 'https://checkout.example/s', now() + interval '1 hour', $7, now(), now())`,
      [
        id,
        tenantId,
        randomUUID(),
        debtId,
        intentId,
        randomBytes(16).toString('hex'),
        CONCEPTS.CHECKOUT_OPEN,
      ],
    );
    return id;
  }

  async function seed(over: { amount?: string; outstanding?: string } = {}) {
    const tenantId = randomUUID();
    const debtId = await seedDebt(tenantId, over.outstanding);
    const intent = await seedIntent(tenantId, debtId, { amount: over.amount });
    const sessionId = await seedSession(tenantId, debtId, intent.id);
    return {
      tenantId,
      intentId: intent.id,
      ref: intent.ref,
      debtId,
      sessionId,
    } satisfies Seed;
  }

  function webhook(
    ref: string,
    over: { id?: string; type?: string; amountMinor?: number } = {},
  ) {
    const type = over.type ?? 'payment_intent.succeeded';
    const id = over.id ?? randomUUID();
    const payload = JSON.stringify(
      {
        id,
        object: 'event',
        type,
        created_at: new Date().toISOString(),
        mode: 'test',
        data: {
          object: {
            payment_intent_id: ref,
            status: type.replace('payment_intent.', ''),
            amount_minor: over.amountMinor ?? 15000,
            currency: 'BOB',
          },
        },
      },
      null,
      2,
    );
    return {
      id,
      headers: signTestWebhook({
        id,
        timestamp: Math.floor(Date.now() / 1000),
        payload,
      }),
      rawBody: Buffer.from(payload),
    };
  }

  async function snapshot(s: Seed) {
    const [intent] = await q(
      `select status_concept_id from payments.payment_intents where id = $1`,
      [s.intentId],
    );
    const [debt] = await q(
      `select status_concept_id, outstanding_amount::text as outstanding from payments.payment_debts where id = $1`,
      [s.debtId],
    );
    const [session] = await q(
      `select status_concept_id from payments.payment_checkout_sessions where id = $1`,
      [s.sessionId],
    );
    const events = await q(
      `select event_type, processed from payments.payment_webhook_events where related_intent_id = $1 order by recorded_at`,
      [s.intentId],
    );
    return { intent, debt, session, events };
  }

  // ------------------------------------------------------------------ pruebas
  it('el rol de aplicación es real: sin contexto de tenant la política no le muestra ninguna fila', async () => {
    const s = await seed();
    const [role] = await q(
      `select rolsuper, rolbypassrls from pg_roles where rolname = $1`,
      [APP_ROLE],
    );
    expect(role).toEqual({ rolsuper: false, rolbypassrls: false });
    const visible = await app.em
      .getConnection()
      .execute(
        `select count(*)::int as n from payments.payment_intents where id = ?`,
        [s.intentId],
        'all',
      );
    expect(visible[0].n).toBe(0);
  });

  it('succeeded firmado: se aplica UNA vez bajo RLS (intención cobrada, deuda saldada, checkout cerrado, evento archivado)', async () => {
    const s = await seed();

    const res = await service.receive(webhook(s.ref));

    expect(res).toMatchObject({
      applied: true,
      duplicate: false,
      reconciliationRequired: false,
      decision: 'aplicar',
    });
    const snap = await snapshot(s);
    expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_SUCCEEDED);
    expect(snap.debt.outstanding).toBe('0.000000');
    expect(snap.debt.status_concept_id).toBe(CONCEPTS.DEBT_SETTLED);
    expect(snap.session.status_concept_id).toBe(CONCEPTS.CHECKOUT_COMPLETED);
    expect(snap.events).toEqual([
      { event_type: 'payment_intent.succeeded', processed: true },
    ]);
  });

  it('la reentrega del mismo webhook-id es un duplicado y no repite el efecto', async () => {
    const s = await seed({ amount: '100.00' });
    const w = webhook(s.ref, { amountMinor: 10000 });

    const first = await service.receive(w);
    const second = await service.receive(w);
    const third = await service.receive(w);

    expect(first).toMatchObject({ applied: true, duplicate: false });
    expect(second).toMatchObject({ applied: false, duplicate: true });
    expect(third.duplicate).toBe(true);
    const snap = await snapshot(s);
    expect(snap.debt.outstanding).toBe('50.000000');
    expect(snap.events).toHaveLength(1);
  });

  it('10 entregas concurrentes del mismo webhook-id bajo RLS: un solo efecto', async () => {
    const s = await seed({ amount: '100.00' });
    const w = webhook(s.ref, { amountMinor: 10000 });

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => service.receive(w)),
    );

    expect(
      results
        .filter((r) => r.status === 'rejected')
        .map((r) => String((r as PromiseRejectedResult).reason)),
    ).toEqual([]);
    const values = results.map((r) => (r as PromiseFulfilledResult<any>).value);
    expect(values.filter((v) => v.applied === true)).toHaveLength(1);
    expect(values.filter((v) => v.duplicate === true)).toHaveLength(9);
    const snap = await snapshot(s);
    expect(snap.debt.outstanding).toBe('50.000000');
    expect(snap.events).toHaveLength(1);
  });

  it('un evento no terminal (processing) se APLICA bajo RLS en vez de descartarse como «no asociado»', async () => {
    const s = await seed();

    const res = await service.receive(
      webhook(s.ref, { type: 'payment_intent.processing' }),
    );

    expect(res).toMatchObject({ applied: true, ignored: false });
    expect((await snapshot(s)).intent.status_concept_id).toBe(
      CONCEPTS.PI_PROCESSING,
    );
  });

  describe('aislamiento entre tenants', () => {
    it('el evento de la intención del tenant B no toca ninguna fila del tenant A', async () => {
      const a = await seed();
      const b = await seed();

      const res = await service.receive(webhook(b.ref));

      expect(res.applied).toBe(true);
      const snapA = await snapshot(a);
      expect(snapA.intent.status_concept_id).toBe(CONCEPTS.PI_PENDING);
      expect(snapA.debt.outstanding).toBe('150.000000');
      expect(snapA.debt.status_concept_id).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
      expect(snapA.session.status_concept_id).toBe(CONCEPTS.CHECKOUT_OPEN);
      expect(snapA.events).toHaveLength(0);
      expect((await snapshot(b)).debt.status_concept_id).toBe(
        CONCEPTS.DEBT_SETTLED,
      );
    });

    it('una intención del tenant B cuya sesión apunta a una deuda del tenant A no la toca: se concilia', async () => {
      const a = await seed();
      const tenantB = randomUUID();
      const debtB = await seedDebt(tenantB);
      const intentB = await seedIntent(tenantB, debtB);
      // Sesión del tenant B ligada a la deuda del tenant A (vínculo cruzado).
      const crossSession = await seedSession(tenantB, a.debtId, intentB.id);

      const res = await service.receive(webhook(intentB.ref));

      expect(res).toMatchObject({
        applied: true,
        reconciliationRequired: true,
      });
      const snapA = await snapshot(a);
      expect(snapA.debt.outstanding).toBe('150.000000');
      expect(snapA.debt.status_concept_id).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
      const [session] = await q(
        `select status_concept_id from payments.payment_checkout_sessions where id = $1`,
        [crossSession],
      );
      expect(session.status_concept_id).toBe(CONCEPTS.CHECKOUT_OPEN);
      const events = await q(
        `select processed from payments.payment_webhook_events where related_intent_id = $1`,
        [intentB.id],
      );
      expect(events).toEqual([{ processed: false }]);
    });

    it('dos intenciones de tenants distintos con el MISMO pi_… (sin UNIQUE en el DDL): no se aplica a ninguna', async () => {
      const a = await seed();
      const tenantB = randomUUID();
      const debtB = await seedDebt(tenantB);
      // Mismo `gateway_intent_ref` que la del tenant A: el DDL no lo impide.
      const clone = await seedIntent(tenantB, debtB, { ref: a.ref });

      await expect(service.receive(webhook(a.ref))).rejects.toMatchObject({
        status: 409,
      });

      expect((await snapshot(a)).intent.status_concept_id).toBe(
        CONCEPTS.PI_PENDING,
      );
      const [other] = await q(
        `select status_concept_id from payments.payment_intents where id = $1`,
        [clone.id],
      );
      expect(other.status_concept_id).toBe(CONCEPTS.PI_PENDING);
      expect(
        await q(
          `select 1 from payments.payment_webhook_events where related_intent_id = any($1)`,
          [[a.intentId, clone.id]],
        ),
      ).toHaveLength(0);
    });
  });

  describe('cobro desconocido', () => {
    it('terminal: 404 (se reintenta) y no se persiste nada', async () => {
      const before = await q(
        `select count(*)::int as n from payments.payment_webhook_events`,
      );
      await expect(
        service.receive(webhook(`pi_${randomBytes(8).toString('hex')}`)),
      ).rejects.toMatchObject({ status: 404 });
      const after = await q(
        `select count(*)::int as n from payments.payment_webhook_events`,
      );
      expect(after[0].n).toBe(before[0].n);
    });

    it('no terminal: se confirma sin efecto', async () => {
      const res = await service.receive(
        webhook(`pi_${randomBytes(8).toString('hex')}`, {
          type: 'payment_intent.processing',
        }),
      );
      expect(res).toMatchObject({ ignored: true, applied: false });
    });
  });

  describe('el contexto de tenant no se filtra', () => {
    it('tras procesar un evento, las conexiones del pool siguen sin ver filas ni tener elevación SYSTEM', async () => {
      const s = await seed();
      await service.receive(webhook(s.ref));
      await service.receive(webhook(s.ref, { type: 'payment_intent.failed' }));

      // Muchas lecturas planas: cualquiera que reutilice la conexión de la transacción vería la fila.
      const reads = await Promise.all(
        Array.from({ length: 20 }, () =>
          app.em
            .getConnection()
            .execute(
              `select count(*)::int as n, current_setting('app.current_tenant_id', true) as t, current_setting('app.system_context', true) as sc from payments.payment_intents`,
              [],
              'all',
            ),
        ),
      );
      for (const [row] of reads) {
        expect(row.n).toBe(0);
        expect(row.t || '').toBe('');
        expect(row.sc === null || row.sc === '' || row.sc === 'false').toBe(
          true,
        );
      }
    });
  });
  describe('N6: dos webhooks de intenciones distintas sobre la MISMA deuda no se interbloquean', () => {
    /** Dos intenciones con su sesión abierta sobre la misma deuda (el estado excepcional que m6 tolera). */
    async function twoOnOneDebt() {
      const tenantId = randomUUID();
      const debtId = await seedDebt(tenantId);
      const a = await seedIntent(tenantId, debtId);
      const b = await seedIntent(tenantId, debtId);
      await seedSession(tenantId, debtId, a.id);
      await seedSession(tenantId, debtId, b.id);
      return { debtId, a, b };
    }
    const failureCodes = (settled: PromiseSettledResult<unknown>[]) =>
      settled.flatMap((r) =>
        r.status === 'rejected'
          ? [
              String(
                (r.reason as any)?.code ??
                  (r.reason as any)?.status ??
                  (r.reason as any)?.message,
              ),
            ]
          : [],
      );

    it('A(failed) || B(succeeded), 40 rondas, rol NOBYPASSRLS: CERO interbloqueos (40P01) y la deuda termina saldada', async () => {
      const errors: string[] = [];
      for (let round = 0; round < 40; round += 1) {
        const { debtId, a, b } = await twoOnOneDebt();
        const settled = await Promise.allSettled([
          service.receive(webhook(a.ref, { type: 'payment_intent.failed' })),
          service.receive(webhook(b.ref)),
        ]);
        const codes = failureCodes(settled);
        errors.push(...codes);
        // El primer interbloqueo (40P01) se nombra en el fallo, con su ronda.
        expect({ round, codes }).toEqual({ round, codes: [] });
        const [debt] = await q(
          `select status_concept_id, outstanding_amount::text as o from payments.payment_debts where id = $1`,
          [debtId],
        );
        expect(debt).toEqual({
          status_concept_id: CONCEPTS.DEBT_SETTLED,
          o: '0.000000',
        });
      }
      expect(errors).toEqual([]);
    });

    it('A(failed) || B(failed), 20 rondas: sin interbloqueos y la deuda vuelve a pendiente cuando se cierran las dos sesiones', async () => {
      const errors: string[] = [];
      for (let round = 0; round < 20; round += 1) {
        const { debtId, a, b } = await twoOnOneDebt();
        const settled = await Promise.allSettled([
          service.receive(webhook(a.ref, { type: 'payment_intent.failed' })),
          service.receive(webhook(b.ref, { type: 'payment_intent.failed' })),
        ]);
        const codes = failureCodes(settled);
        errors.push(...codes);
        // El primer interbloqueo (40P01) se nombra en el fallo, con su ronda.
        expect({ round, codes }).toEqual({ round, codes: [] });
        const [debt] = await q(
          `select status_concept_id from payments.payment_debts where id = $1`,
          [debtId],
        );
        expect(debt.status_concept_id).toBe(CONCEPTS.DEBT_PENDING);
        const open = await q(
          `select count(*)::int as n from payments.payment_checkout_sessions where payment_debt_id = $1 and status_concept_id = $2`,
          [debtId, CONCEPTS.CHECKOUT_OPEN],
        );
        expect(open[0].n).toBe(0);
      }
      expect(errors).toEqual([]);
    });

    it('con UNA sola intención fallando mientras la otra conserva su sesión abierta, la deuda NO se libera (m6 sigue vigente)', async () => {
      const { debtId, a } = await twoOnOneDebt();
      await service.receive(webhook(a.ref, { type: 'payment_intent.failed' }));
      const [debt] = await q(
        `select status_concept_id from payments.payment_debts where id = $1`,
        [debtId],
      );
      expect(debt.status_concept_id).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
    });
  });
});
