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
 * Receptor de webhooks de la pasarela contra PostgreSQL REAL (INT.H1.M3).
 *
 * Lo que un doble no puede demostrar y esta prueba sí: el índice único real de la
 * bandeja (`uq_payment_webhook_events_gateway_event_ref`), el `FOR UPDATE` real
 * que serializa las entregas concurrentes y el rollback real de una transacción
 * con efectos ya escritos.
 *
 * NO levanta `AppModule` (exige Mongo y OpenSearch). Usa el servicio y los
 * repositorios REALES con un `EntityManager` real sobre una base NUEVA y
 * DESCARTABLE que la propia prueba crea y borra en el Postgres del compose de
 * DESARROLLO de la pasarela (`pasarelapago/platform/compose.yml`, 127.0.0.1:54321).
 * Nunca se conecta a otra base de datos que no sea la suya, salvo a la base
 * administrativa `postgres` para ejecutar CREATE/DROP DATABASE de la suya.
 *
 * DDL: las tablas, índices y claves foráneas salen del DDL REAL del repositorio
 * (`database/SQL/42_payments/{01_schema,02_tables,03_fk_intra,04_indexes}.sql`),
 * extraídos por expresión regular, sin escribir DDL a mano. Sólo se aplican las
 * tablas que el servicio toca (más `payment_gateways`, referenciada por clave
 * foránea). Las claves foráneas hacia tablas que no se crean
 * (`gateway_connections`, `payment_methods`, `provider_callback_endpoints`) y las
 * diferidas (`90_fk_deferred.sql`, hacia otros esquemas) NO se aplican: es una
 * limitación declarada, no una invención; las filas de prueba usan UUID
 * sintéticos en esas columnas.
 *
 * Para correrla (opt-in explícito):
 *   PAYMENTS_WEBHOOK_IT=local-throwaway-db \
 *   node --experimental-vm-modules node_modules/jest-cli/bin/jest.js \
 *     --config test/jest-integration.json payments-gateway-webhook
 */

const OPT_IN = process.env.PAYMENTS_WEBHOOK_IT === 'local-throwaway-db';
const describeIt = OPT_IN ? describe : describe.skip;

// Credenciales de DESARROLLO del compose de la pasarela (platform/compose.yml);
// sobreescribibles por entorno. No son un secreto de ningún entorno real.
const PG = {
  host: process.env.PAYMENTS_WEBHOOK_IT_HOST ?? '127.0.0.1',
  port: Number(process.env.PAYMENTS_WEBHOOK_IT_PORT ?? 54321),
  user: process.env.PAYMENTS_WEBHOOK_IT_USER ?? 'postgres',
  password: process.env.PAYMENTS_WEBHOOK_IT_PASSWORD ?? 'pay',
};
const DB_NAME = `mantra_it_whk_${randomBytes(5).toString('hex')}`;
const TABLES = [
  'payment_gateways',
  'payment_intents',
  'payment_debts',
  'payment_checkout_sessions',
  'payment_webhook_events',
] as const;

const DDL_DIR = join(process.cwd(), 'database', 'SQL', '42_payments');
const ddl = (file: string) => readFileSync(join(DDL_DIR, file), 'utf8');

/** Sentencias del DDL real, filtradas a las tablas de la prueba. */
function realDdl(): {
  schema: string;
  tables: string[];
  indexes: string[];
  fks: string[];
  skippedFks: string[];
} {
  const tables = TABLES.map((name) => {
    const statement = ddl('02_tables.sql').match(
      new RegExp(
        `CREATE TABLE IF NOT EXISTS "payments"\\."${name}" \\([\\s\\S]*?\\n\\);`,
      ),
    )?.[0];
    if (!statement) throw new Error(`Falta la tabla canónica payments.${name}`);
    return statement;
  });
  const inSet = (t: string) => (TABLES as readonly string[]).includes(t);
  const indexes = [
    ...ddl('04_indexes.sql').matchAll(
      /CREATE (?:UNIQUE )?INDEX IF NOT EXISTS "[^"]+" ON "payments"\."(\w+)"[^;]*;/g,
    ),
  ]
    .filter((m) => inSet(m[1]))
    .map((m) => m[0]);
  const fks: string[] = [];
  const skippedFks: string[] = [];
  for (const m of ddl('03_fk_intra.sql').matchAll(
    /DO \$\$ BEGIN\s+ALTER TABLE "payments"\."(\w+)"\s+ADD CONSTRAINT "(\w+)" FOREIGN KEY[\s\S]*?REFERENCES "payments"\."(\w+)"[\s\S]*?END \$\$;/g,
  )) {
    if (!inSet(m[1])) continue;
    (inSet(m[3]) ? fks : skippedFks).push(
      inSet(m[3]) ? m[0] : `${m[2]} -> ${m[3]}`,
    );
  }
  return { schema: ddl('01_schema.sql'), tables, indexes, fks, skippedFks };
}

describeIt('PaymentsGatewayWebhookService contra PostgreSQL real', () => {
  let orm: MikroORM;
  let service: PaymentsGatewayWebhookService;
  let flowRepo: PaymentFlowRepository;
  let txRepo: PaymentTransactionsRepository;
  let admin: Client;
  let applied: ReturnType<typeof realDdl>;
  const sqlLog: string[] = [];

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

  const run = (sql: string, params: unknown[] = []) =>
    orm.em.getConnection().execute(sql, params, 'run');
  const rows = <T = Record<string, any>>(sql: string, params: unknown[] = []) =>
    orm.em.getConnection().execute(sql, params, 'all') as Promise<T[]>;

  function buildService(txRepository: PaymentTransactionsRepository = txRepo) {
    return new PaymentsGatewayWebhookService(
      config,
      orm.em as never,
      new PaymentIntentsRepository(),
      flowRepo,
      txRepository,
      logger as never,
    );
  }

  beforeAll(async () => {
    // Base nueva y descartable: nombre aleatorio, creada y borrada por esta prueba.
    admin = new Client({ ...PG, database: 'postgres' });
    await admin.connect();
    const exists = await admin.query(
      'select 1 from pg_database where datname = $1',
      [DB_NAME],
    );
    if (exists.rowCount)
      throw new Error(`La base ${DB_NAME} ya existe: se rechaza reutilizarla`);
    await admin.query(`CREATE DATABASE "${DB_NAME}"`);

    orm = await MikroORM.init({
      host: PG.host,
      port: PG.port,
      user: PG.user,
      password: PG.password,
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
      // Se registran las sentencias para demostrar que el efecto parcial SÍ llegó a la base antes del rollback.
      debug: ['query'],
      logger: (message: string) => sqlLog.push(message),
    });

    const state = await rows<{ db: string; tables: string | null }>(
      `select current_database() as db, to_regclass('payments.payment_intents')::text as tables`,
    );
    if (state[0].db !== DB_NAME || state[0].tables) {
      throw new Error(
        'Se rechaza una base que no es la descartable y vacía de esta prueba',
      );
    }

    applied = realDdl();
    await run(applied.schema);
    for (const statement of [
      ...applied.tables,
      ...applied.indexes,
      ...applied.fks,
    ]) {
      await run(statement);
    }
    // Mutación para demostrar que la prueba muerde: quita el índice único real de la bandeja.
    if (
      process.env.PAYMENTS_WEBHOOK_IT_MUTATION?.includes('drop-unique-index')
    ) {
      await run(
        'drop index payments.uq_payment_webhook_events_gateway_event_ref',
      );
    }
    // INSTRUMENTACIÓN DE PRUEBA, no esquema del producto y sólo en esta base descartable:
    // un disparador diferido que falla AL COMMIT para los eventos cuyo id empieza con
    // `fa11fa11-`. Como se evalúa en el COMMIT, para entonces la intención, la deuda y la
    // sesión YA se escribieron dentro de la transacción: es un efecto parcial real.
    await run(`create function payments.it_fail_at_commit() returns trigger language plpgsql as $$
      begin
        if new.gateway_event_ref like 'pay-gateway:fa11fa11-%' then
          raise exception 'fallo inducido al commit';
        end if;
        return null;
      end $$`);
    await run(`create constraint trigger it_fail_at_commit after insert on payments.payment_webhook_events
      deferrable initially deferred for each row execute function payments.it_fail_at_commit()`);

    flowRepo = new PaymentFlowRepository();
    txRepo = new PaymentTransactionsRepository();
    service = buildService();
  });

  afterAll(async () => {
    await orm?.close(true);
    if (admin) {
      // Sólo la base propia (nombre con prefijo y sufijo aleatorio de esta corrida).
      await admin.query(
        `select pg_terminate_backend(pid) from pg_stat_activity where datname = $1 and pid <> pg_backend_pid()`,
        [DB_NAME],
      );
      await admin.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
      await admin.end();
    }
  });

  // ---------------------------------------------------------------- semillas
  interface Seed {
    intentId: string;
    ref: string;
    debtId: string;
    sessionId: string;
    gatewayId: string;
    tenantId: string;
  }

  async function seed(
    over: { amount?: string; outstanding?: string; withDebt?: boolean } = {},
  ): Promise<Seed> {
    const s: Seed = {
      intentId: randomUUID(),
      ref: `pi_${randomBytes(8).toString('hex')}`,
      debtId: randomUUID(),
      sessionId: randomUUID(),
      gatewayId: randomUUID(),
      tenantId: randomUUID(),
    };
    const amount = over.amount ?? '150.00';
    await run(
      `insert into payments.payment_gateways (id, code, name, gateway_type_concept_id, state_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now())`,
      [
        s.gatewayId,
        `it-${s.gatewayId.slice(0, 8)}`,
        'Pasarela de prueba (sintética)',
        randomUUID(),
        randomUUID(),
      ],
    );
    await run(
      `insert into payments.payment_intents
         (id, tenant_id, gateway_id, purpose_concept_id, source_ref_type, source_ref_id, amount, currency_concept_id,
          idempotency_key, gateway_intent_ref, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, 'payment_debt', ?, ?, ?, ?, ?, ?, now(), now())`,
      [
        s.intentId,
        s.tenantId,
        s.gatewayId,
        CONCEPTS.PAY_PURPOSE_DEBT,
        s.debtId,
        amount,
        CONCEPTS.CURRENCY_BOB,
        `it-${s.intentId}`,
        s.ref,
        CONCEPTS.PI_PENDING,
      ],
    );
    if (over.withDebt !== false) {
      await run(
        `insert into payments.payment_debts
           (id, tenant_id, gateway_connection_id, debtor_business_partner_id, internal_debt_number, currency_code,
            total_amount, outstanding_amount, due_at, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, 'BOB', ?, ?, now() + interval '7 days', ?, now(), now())`,
        [
          s.debtId,
          s.tenantId,
          randomUUID(),
          randomUUID(),
          `D-${s.debtId.slice(0, 8)}`,
          '150.000000',
          over.outstanding ?? '150.000000',
          CONCEPTS.DEBT_IN_CHECKOUT,
        ],
      );
      await run(
        `insert into payments.payment_checkout_sessions
           (id, tenant_id, gateway_connection_id, payment_debt_id, payment_intent_id, session_token_hash, redirect_url,
            expires_at, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, 'https://checkout.example/s', now() + interval '1 hour', ?, now(), now())`,
        [
          s.sessionId,
          s.tenantId,
          randomUUID(),
          s.debtId,
          s.intentId,
          randomBytes(16).toString('hex'),
          CONCEPTS.CHECKOUT_OPEN,
        ],
      );
    }
    return s;
  }

  function webhook(
    s: Seed,
    over: { id?: string; type?: string; amountMinor?: number } = {},
  ) {
    const type = over.type ?? 'payment_intent.succeeded';
    const id = over.id ?? randomUUID();
    // Espacios y saltos de línea a propósito: lo firmado son los bytes.
    const payload = JSON.stringify(
      {
        id,
        object: 'event',
        type,
        created_at: new Date().toISOString(),
        mode: 'test',
        data: {
          object: {
            payment_intent_id: s.ref,
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
    const [intent] = await rows(
      `select status_concept_id, row_version from payments.payment_intents where id = ?`,
      [s.intentId],
    );
    const [debt] = await rows(
      `select status_concept_id, outstanding_amount::text as outstanding, settled_at from payments.payment_debts where id = ?`,
      [s.debtId],
    );
    const [session] = await rows(
      `select status_concept_id from payments.payment_checkout_sessions where id = ?`,
      [s.sessionId],
    );
    const events = await rows(
      `select gateway_event_ref, event_type, processed, related_intent_id from payments.payment_webhook_events where related_intent_id = ? order by recorded_at`,
      [s.intentId],
    );
    return { intent, debt, session, events };
  }

  // ------------------------------------------------------------------- DDL
  it('el DDL aplicado es el real: tablas, índice único de la bandeja y claves foráneas internas', async () => {
    const unique = await rows(
      `select indexdef from pg_indexes where schemaname = 'payments' and indexname = 'uq_payment_webhook_events_gateway_event_ref'`,
    );
    expect(unique).toHaveLength(1);
    expect(unique[0].indexdef).toMatch(/CREATE UNIQUE INDEX/u);
    expect(applied.tables).toHaveLength(TABLES.length);
    // Límite declarado: FKs hacia tablas que no se crean.
    expect(applied.skippedFks.length).toBeGreaterThan(0);
    process.stdout.write(
      `DDL real aplicado: ${applied.tables.length} tablas, ${applied.indexes.length} índices, ${applied.fks.length} FK internas; FK omitidas: ${applied.skippedFks.join(', ')}\n`,
    );
  });

  it('el índice único de la bandeja es del motor: una segunda fila con el mismo gateway_event_ref falla con 23505', async () => {
    const s = await seed();
    const insert = () =>
      run(
        `insert into payments.payment_webhook_events (id, gateway_id, event_type, gateway_event_ref, payload_json, recorded_at)
         values (?, ?, 'payment_intent.succeeded', ?, '{}'::jsonb, now())`,
        [randomUUID(), s.gatewayId, `pay-gateway:unique-${s.ref}`],
      );
    await insert();
    await expect(insert()).rejects.toMatchObject({ code: '23505' });
  });

  // -------------------------------------------------------------- escenarios
  describe('(1) duplicado secuencial: un solo efecto', () => {
    it('la reentrega del mismo webhook-id no repite el efecto (la deuda se descuenta una vez)', async () => {
      const s = await seed({ amount: '100.00' });
      const w = webhook(s, { amountMinor: 10000 });

      const first = await service.receive(w);
      const second = await service.receive(w);
      const third = await service.receive(w);

      expect(first).toMatchObject({ applied: true, duplicate: false });
      expect(second).toMatchObject({ applied: false, duplicate: true });
      expect(third.duplicate).toBe(true);
      const snap = await snapshot(s);
      expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_SUCCEEDED);
      expect(snap.debt.outstanding).toBe('50.000000');
      expect(snap.debt.status_concept_id).toBe(CONCEPTS.DEBT_PENDING);
      expect(snap.session.status_concept_id).toBe(CONCEPTS.CHECKOUT_COMPLETED);
      expect(snap.events).toHaveLength(1);
      expect(snap.events[0]).toMatchObject({
        gateway_event_ref: `pay-gateway:${w.id}`,
        processed: true,
      });
    });
  });

  describe('(2) N entregas CONCURRENTES del mismo webhook-id', () => {
    it('10 en paralelo, en 8 rondas con intenciones nuevas: siempre una sola fila en la bandeja y la deuda descontada UNA vez', async () => {
      for (let round = 0; round < 8; round += 1) {
        const s = await seed({ amount: '100.00' });
        const w = webhook(s, { amountMinor: 10000 });

        const results = await Promise.allSettled(
          Array.from({ length: 10 }, () => service.receive(w)),
        );

        const fulfilled = results.filter(
          (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled',
        );
        expect(
          results
            .filter((r) => r.status === 'rejected')
            .map((r) => String((r as PromiseRejectedResult).reason)),
        ).toEqual([]);
        expect(fulfilled).toHaveLength(10);
        expect(fulfilled.filter((r) => r.value.applied === true)).toHaveLength(
          1,
        );
        expect(
          fulfilled.filter((r) => r.value.duplicate === true),
        ).toHaveLength(9);
        const snap = await snapshot(s);
        expect(snap.events).toHaveLength(1);
        expect(snap.debt.outstanding).toBe('50.000000');
        expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_SUCCEEDED);
      }
    });

    it('30 entregas en paralelo de 3 eventos distintos (processing, succeeded y la repetición de succeeded): estado final consistente y deuda descontada una vez', async () => {
      const s = await seed({ amount: '100.00' });
      const processing = webhook(s, {
        type: 'payment_intent.processing',
        amountMinor: 10000,
      });
      const succeeded = webhook(s, { amountMinor: 10000 });
      const burst = [
        ...Array.from({ length: 10 }, () => processing),
        ...Array.from({ length: 20 }, () => succeeded),
      ].sort(() => Math.random() - 0.5);

      const results = await Promise.allSettled(
        burst.map((w) => service.receive(w)),
      );

      expect(
        results
          .filter((r) => r.status === 'rejected')
          .map((r) => String((r as PromiseRejectedResult).reason)),
      ).toEqual([]);
      const snap = await snapshot(s);
      expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_SUCCEEDED);
      expect(snap.debt.outstanding).toBe('50.000000');
      // Una fila por evento distinto, sin importar el orden de llegada.
      expect(snap.events.map((e) => e.event_type).sort()).toEqual([
        'payment_intent.processing',
        'payment_intent.succeeded',
      ]);
    });
  });

  describe('(3) eventos en orden invertido: no retrocede', () => {
    it('processing llega DESPUÉS de succeeded: obsoleto, el estado y la deuda no cambian', async () => {
      const s = await seed({ amount: '100.00' });
      await service.receive(webhook(s, { amountMinor: 10000 }));
      const before = await snapshot(s);

      const late = await service.receive(
        webhook(s, { type: 'payment_intent.processing', amountMinor: 10000 }),
      );

      expect(late).toMatchObject({
        applied: false,
        decision: 'obsoleto',
        reconciliationRequired: false,
      });
      const after = await snapshot(s);
      expect(after.intent.status_concept_id).toBe(CONCEPTS.PI_SUCCEEDED);
      expect(after.debt.outstanding).toBe(before.debt.outstanding);
      expect(after.events).toHaveLength(2);
    });

    it('failed después de succeeded es una contradicción: nada se sobrescribe y queda archivada sin procesar', async () => {
      const s = await seed({ amount: '100.00' });
      await service.receive(webhook(s, { amountMinor: 10000 }));

      const res = await service.receive(
        webhook(s, { type: 'payment_intent.failed' }),
      );

      expect(res).toMatchObject({
        decision: 'contradiccion',
        reconciliationRequired: true,
      });
      const snap = await snapshot(s);
      expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_SUCCEEDED);
      expect(snap.debt.outstanding).toBe('50.000000');
      expect(snap.events.filter((e) => e.processed === false)).toHaveLength(1);
    });
  });

  describe('(4) succeeded con importe distinto', () => {
    it('queda archivado con processed=false y no toca la intención ni la deuda', async () => {
      const s = await seed();

      const res = await service.receive(webhook(s, { amountMinor: 15001 }));

      expect(res).toMatchObject({
        applied: false,
        reconciliationRequired: true,
        decision: 'contradiccion',
      });
      const snap = await snapshot(s);
      expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_PENDING);
      expect(snap.debt.outstanding).toBe('150.000000');
      expect(snap.debt.status_concept_id).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
      expect(snap.session.status_concept_id).toBe(CONCEPTS.CHECKOUT_OPEN);
      expect(snap.events).toHaveLength(1);
      expect(snap.events[0].processed).toBe(false);
    });
  });

  describe('(5) rollback tras un efecto parcial', () => {
    it('si la transacción falla AL COMMIT, con intención, deuda y sesión ya escritas, no queda nada persistido', async () => {
      const s = await seed({ amount: '100.00' });
      const poisoned = webhook(s, {
        id: 'fa11fa11-0000-4000-8000-000000000001',
        amountMinor: 10000,
      });
      sqlLog.length = 0;

      await expect(service.receive(poisoned)).rejects.toThrow(
        /fallo inducido al commit/u,
      );

      // Prueba de que el efecto parcial SÍ se escribió dentro de la transacción antes del fallo.
      const statements = sqlLog.join('\n').toLowerCase();
      expect(statements).toMatch(/update "payments"\."payment_intents" set/u);
      expect(statements).toMatch(/update "payments"\."payment_debts" set/u);
      expect(statements).toMatch(
        /update "payments"\."payment_checkout_sessions" set/u,
      );
      expect(statements).toMatch(
        /insert into "payments"\."payment_webhook_events"/u,
      );
      expect(statements).toMatch(/rollback/u);

      // Y después del rollback, nada.
      const snap = await snapshot(s);
      expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_PENDING);
      expect(snap.debt.outstanding).toBe('150.000000');
      expect(snap.debt.status_concept_id).toBe(CONCEPTS.DEBT_IN_CHECKOUT);
      expect(snap.session.status_concept_id).toBe(CONCEPTS.CHECKOUT_OPEN);
      expect(snap.events).toHaveLength(0);
      expect(
        (
          await rows(
            `select count(*)::int as n from payments.payment_webhook_events where gateway_event_ref = ?`,
            [`pay-gateway:${poisoned.id}`],
          )
        )[0].n,
      ).toBe(0);

      // Otro evento sano sobre la misma intención se aplica una vez, como si nada hubiera pasado.
      const retry = await service.receive(webhook(s, { amountMinor: 10000 }));
      expect(retry.applied).toBe(true);
      expect((await snapshot(s)).debt.outstanding).toBe('50.000000');
    });
  });

  describe('(6) evento de un cobro desconocido', () => {
    it('terminal: 404 (no 2xx) y no se persiste nada', async () => {
      const ghost: Seed = {
        ...(await seed({ withDebt: false })),
        ref: `pi_${randomBytes(8).toString('hex')}`,
      };
      const before = await rows(
        `select count(*)::int as n from payments.payment_webhook_events`,
      );

      await expect(service.receive(webhook(ghost))).rejects.toMatchObject({
        status: 404,
      });

      const after = await rows(
        `select count(*)::int as n from payments.payment_webhook_events`,
      );
      expect(after[0].n).toBe(before[0].n);
    });

    it('no terminal: se confirma sin efecto y sin fila', async () => {
      const ghost: Seed = {
        ...(await seed({ withDebt: false })),
        ref: `pi_${randomBytes(8).toString('hex')}`,
      };
      const res = await service.receive(
        webhook(ghost, { type: 'payment_intent.processing' }),
      );
      expect(res).toMatchObject({ ignored: true, applied: false });
      expect(
        (
          await rows(
            `select count(*)::int as n from payments.payment_webhook_events where gateway_event_ref like ?`,
            [`%${ghost.ref}%`],
          )
        )[0].n,
      ).toBe(0);
    });
  });
});
