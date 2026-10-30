import 'reflect-metadata';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MikroORM } from '@mikro-orm/postgresql';
import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Client } from 'pg';
import { CONCEPTS, type AuthenticatedUser } from '../../src/common';
import { PaymentIntents } from '../../src/modules/payments/entities/payment_intents.entity';
import { PaymentTransactions } from '../../src/modules/payments/entities/payment_transactions.entity';
import { RiskAssessments } from '../../src/modules/payments/entities/risk_assessments.entity';
import {
  PaymentFlowRepository,
  PaymentIntentsRepository,
  PaymentTransactionsRepository,
} from '../../src/modules/payments/repositories';
import { PaymentsGatewayChargeService } from '../../src/modules/payments/services/payments-gateway-charge.service';
import { PaymentsIntentsService } from '../../src/modules/payments/services/payments-intents.service';
import { PaymentsTransactionsService } from '../../src/modules/payments/services/payments-transactions.service';
import { PaymentsGatewayClient } from '../../src/modules/payments/gateway/payments-gateway.client';
import type { PaymentsGatewayConfig } from '../../src/modules/payments/gateway/payments-gateway.env';
import { deriveGatewayIdempotencyKey } from '../../src/modules/payments/gateway/payments-gateway-idempotency';
import {
  PayGatewayDouble,
  TEST_API_KEY,
} from '../../src/modules/payments/gateway/payments-gateway.double.testing';
import { PaymentsErrorReason } from '../../src/modules/payments/payments.error-reasons';
import type {
  CreatePaymentIntentDto,
  ProcessTransactionDto,
} from '../../src/modules/payments/dto';

/**
 * Camino de COBRO por la pasarela contra PostgreSQL REAL (INT.H1.M2).
 *
 * Ejercita `PaymentsIntentsService.createIntent`, `assessRisk` y
 * `PaymentsTransactionsService.processTransaction` (con `payments.via_gateway`
 * encendido y apagado) con los repositorios, el `EntityManager` y las
 * transacciones REALES. El único colaborador simulado es la pasarela, y es el
 * DOBLE HTTP declarado `gateway/payments-gateway.double.testing.ts` (un servidor
 * HTTP real, no la pasarela): lo que se prueba contra él nunca se presenta como
 * resultado contra `pay-edge`.
 *
 * Lo que un doble en memoria no puede demostrar y esta prueba sí: el `FOR UPDATE`
 * real de la compuerta y de la asociación del `pi_…`, el bloqueo optimista
 * (`row_version`) de MikroORM, el rollback real de `createIntent`, y que la
 * evaluación de riesgo, las transacciones locales y la intención sean las filas
 * que de verdad se leen.
 *
 * NO levanta `AppModule` (exige Mongo y OpenSearch). Crea una base NUEVA y
 * DESCARTABLE en el Postgres del compose de DESARROLLO de la pasarela
 * (`pasarelapago/platform/compose.yml`, 127.0.0.1:54321) y la borra al terminar.
 *
 * DDL: tablas, índices y claves foráneas salen del DDL REAL del repositorio
 * (`database/SQL/42_payments/{01_schema,02_tables,03_fk_intra,04_indexes}.sql`),
 * extraídos por expresión regular, sin escribir DDL a mano. Sólo se aplican las
 * tablas que el camino de cobro toca (`payment_gateways`, `payment_intents`,
 * `payment_transactions`, `risk_assessments`). Las claves foráneas hacia tablas
 * que no se crean (conexiones, métodos de pago, etc.) y las diferidas hacia otros
 * esquemas (`90_fk_deferred.sql`) NO se aplican: es una limitación declarada, no
 * una invención; las filas usan UUID sintéticos en esas columnas. La evaluación
 * de riesgo NO exige tablas de otros módulos: `risk_assessments` sólo referencia
 * a `payment_intents`, así que se persiste con el `assessRisk` real.
 *
 * Para correrla (opt-in explícito):
 *   PAYMENTS_CHARGE_IT=local-throwaway-db \
 *   node --experimental-vm-modules node_modules/jest-cli/bin/jest.js \
 *     --config test/jest-integration.json payments-gateway-charge
 */

const OPT_IN = process.env.PAYMENTS_CHARGE_IT === 'local-throwaway-db';
const describeIt = OPT_IN ? describe : describe.skip;

// Credenciales de DESARROLLO del compose de la pasarela; sobreescribibles por entorno.
const PG = {
  host: process.env.PAYMENTS_CHARGE_IT_HOST ?? '127.0.0.1',
  port: Number(process.env.PAYMENTS_CHARGE_IT_PORT ?? 54321),
  user: process.env.PAYMENTS_CHARGE_IT_USER ?? 'postgres',
  password: process.env.PAYMENTS_CHARGE_IT_PASSWORD ?? 'pay',
};
const DB_NAME = `mantra_it_chg_${randomBytes(5).toString('hex')}`;
const TABLES = [
  'payment_gateways',
  'payment_intents',
  'payment_transactions',
  'risk_assessments',
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

const TENANT = randomUUID();
const actor: AuthenticatedUser = {
  id: randomUUID(),
  roles: ['PAYMENTS_ADMIN'],
};
const AMOUNT = '150.00';
const AMOUNT_MINOR = 15000;

const sale = (
  over: Partial<ProcessTransactionDto> = {},
): ProcessTransactionDto => ({
  operation: 'SALE',
  paymentMethodType: 'qr',
  ...over,
});

type Decision = 'APPROVE' | 'REVIEW' | 'DECLINE';

describeIt(
  'Cobro por la pasarela (createIntent + processTransaction) contra PostgreSQL real',
  () => {
    let orm: MikroORM;
    let admin: Client;
    let gatewayId: string;
    let applied: ReturnType<typeof realDdl>;
    const double = new PayGatewayDouble();
    const sqlLog: string[] = [];

    const config = (viaGateway: boolean): PaymentsGatewayConfig => ({
      viaGateway,
      baseUrl: viaGateway ? double.baseUrl : '',
      apiKey: viaGateway ? TEST_API_KEY : '',
      mode: viaGateway ? 'test' : null,
      webhookSecrets: [],
      webhookPublicKeys: [],
      webhookToleranceSeconds: 300,
      timeoutMs: 2000,
      maxAttempts: 3,
      retryBaseMs: 5,
    });
    const logger = {
      setContext: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    };

    const run = (sql: string, params: unknown[] = []) =>
      orm.em.getConnection().execute(sql, params, 'run');
    const rows = <T = Record<string, any>>(
      sql: string,
      params: unknown[] = [],
    ) => orm.em.getConnection().execute(sql, params, 'all') as Promise<T[]>;

    /**
     * Servicios REALES sobre el `EntityManager` y los repositorios reales.
     * Con `viaGateway=false` el cobro por la pasarela recibe IGUAL un cliente que
     * apunta al doble: si el camino viejo llamara a la pasarela, el doble lo vería.
     */
    function build(viaGateway: boolean) {
      const cfg = config(viaGateway);
      const intentsRepo = new PaymentIntentsRepository();
      const flowRepo = new PaymentFlowRepository();
      const txRepo = new PaymentTransactionsRepository();
      const client = new PaymentsGatewayClient({
        ...config(true),
        viaGateway: true,
      });
      const charge = new PaymentsGatewayChargeService(
        cfg,
        orm.em as never,
        intentsRepo,
        logger as never,
        client,
      );
      return {
        charge,
        intents: new PaymentsIntentsService(
          orm.em as never,
          intentsRepo,
          flowRepo,
          logger as never,
          charge,
        ),
        transactions: new PaymentsTransactionsService(
          orm.em as never,
          intentsRepo,
          flowRepo,
          txRepo,
          logger as never,
          charge,
        ),
      };
    }
    let on: ReturnType<typeof build>;
    let off: ReturnType<typeof build>;

    beforeAll(async () => {
      // Base nueva y descartable: nombre aleatorio, creada y borrada por esta prueba.
      admin = new Client({ ...PG, database: 'postgres' });
      await admin.connect();
      const exists = await admin.query(
        'select 1 from pg_database where datname = $1',
        [DB_NAME],
      );
      if (exists.rowCount)
        throw new Error(
          `La base ${DB_NAME} ya existe: se rechaza reutilizarla`,
        );
      await admin.query(`CREATE DATABASE "${DB_NAME}"`);

      orm = await MikroORM.init({
        host: PG.host,
        port: PG.port,
        user: PG.user,
        password: PG.password,
        dbName: DB_NAME,
        entities: [PaymentIntents, PaymentTransactions, RiskAssessments],
        metadataProvider: ReflectMetadataProvider,
        metadataCache: { enabled: false },
        allowGlobalContext: true,
        pool: { min: 0, max: 20 },
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

      gatewayId = randomUUID();
      await run(
        `insert into payments.payment_gateways (id, code, name, gateway_type_concept_id, state_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now())`,
        [
          gatewayId,
          `it-${gatewayId.slice(0, 8)}`,
          'Pasarela de prueba (sintética)',
          randomUUID(),
          randomUUID(),
        ],
      );

      await double.start();
      on = build(true);
      off = build(false);
    });

    afterAll(async () => {
      await double.stop();
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

    beforeEach(() => {
      double.calls.length = 0;
      double.created.clear();
      double.script = [];
    });

    // ---------------------------------------------------------------- ayudas
    interface Created {
      id: string;
      idempotencyKey: string;
      sourceRefId: string;
      /** `Idempotency-Key` que la API debe mandar a la pasarela por este cobro. */
      gatewayKey: string;
    }

    const intentDto = (
      over: Partial<CreatePaymentIntentDto> = {},
    ): CreatePaymentIntentDto => ({
      tenantId: TENANT,
      gatewayId,
      amount: AMOUNT,
      currency: 'BOB',
      purpose: 'DEBT',
      idempotencyKey: `it-chg-${randomUUID()}`,
      sourceRefType: 'payment_debt',
      sourceRefId: randomUUID(),
      ...over,
    });

    /** Crea la intención con el `createIntent` REAL. */
    async function createIntent(
      svc: ReturnType<typeof build> = on,
      over: Partial<CreatePaymentIntentDto> = {},
    ): Promise<Created> {
      const dto = intentDto(over);
      const res = await svc.intents.createIntent(dto, actor);
      return {
        id: res.id,
        idempotencyKey: dto.idempotencyKey,
        sourceRefId: dto.sourceRefId as string,
        gatewayKey: deriveGatewayIdempotencyKey({
          tenantId: dto.tenantId,
          sourceRefType: dto.sourceRefType,
          sourceRefId: dto.sourceRefId,
          invoiceId: dto.invoiceId,
          localIdempotencyKey: dto.idempotencyKey,
        }),
      };
    }

    /** Persiste una evaluación de riesgo con el `assessRisk` REAL. */
    const assess = (intentId: string, decision: Decision, score = '12.5') =>
      on.intents.assessRisk(intentId, { riskScore: score, decision }, actor);

    /** Intención lista para cobrar: creada y con evaluación `APPROVE`. */
    async function approved(): Promise<Created> {
      const c = await createIntent();
      await assess(c.id, 'APPROVE');
      return c;
    }

    const toDollars = (sql: string) => {
      let n = 0;
      return sql.replace(/\?/gu, () => `$${(n += 1)}`);
    };

    /** Inserta una transacción local de la intención (fila real de `payment_transactions`). */
    async function insertTransaction(
      c: Created,
      status: string,
      amount: string,
      exec?: Client,
    ): Promise<string> {
      const id = randomUUID();
      const sql = `insert into payments.payment_transactions
        (id, payment_intent_id, gateway_id, transaction_type_concept_id, amount, currency_concept_id, status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, now(), now())`;
      const params = [
        id,
        c.id,
        gatewayId,
        CONCEPTS.TXN_OP_SALE,
        amount,
        CONCEPTS.CURRENCY_BOB,
        status,
      ];
      if (exec) await exec.query(toDollars(sql), params);
      else await run(sql, params);
      return id;
    }

    async function snapshot(c: Created) {
      const [intent] = await rows(
        `select status_concept_id, gateway_intent_ref, row_version, amount::text as amount
         from payments.payment_intents where id = ?`,
        [c.id],
      );
      const transactions = await rows(
        `select id, status_concept_id, amount::text as amount
         from payments.payment_transactions where payment_intent_id = ? order by created_at`,
        [c.id],
      );
      const risks = await rows(
        `select decision_concept_id from payments.risk_assessments where payment_intent_id = ?`,
        [c.id],
      );
      return { intent, transactions, risks };
    }

    const postsFor = (c: Created) =>
      double.postCalls.filter((p) => p.idempotencyKey === c.gatewayKey);
    const getsFor = (ref: string) =>
      double.calls.filter(
        (p) => p.method === 'GET' && p.path === `/v1/payment_intents/${ref}`,
      );

    /** Espera por CONDICIÓN a que algún backend de esta base esté bloqueado por un lock. */
    async function waitUntilBlocked(settled: Promise<unknown>): Promise<void> {
      let done = false;
      void settled.finally(() => {
        done = true;
      });
      const deadline = Date.now() + 15_000;
      for (;;) {
        if (done)
          throw new Error(
            'La operación terminó sin esperar el bloqueo de la fila: el FOR UPDATE no se tomó',
          );
        const r = await admin.query(
          `select 1 from pg_stat_activity
          where datname = $1 and wait_event_type = 'Lock' and pid <> pg_backend_pid()`,
          [DB_NAME],
        );
        if (r.rowCount) return;
        if (Date.now() > deadline)
          throw new Error('Ningún backend quedó esperando el lock');
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    }

    /** Cliente propio que retiene el bloqueo de la fila de la intención dentro de una transacción. */
    async function holdIntentLock(c: Created): Promise<Client> {
      const holder = new Client({ ...PG, database: DB_NAME });
      // El fallo de una consulta ya llega por su promesa; un corte tardío del socket no debe tumbar la suite.
      holder.on('error', () => undefined);
      await holder.connect();
      await holder.query('begin');
      await holder.query(
        'select id from payments.payment_intents where id = $1 for update',
        [c.id],
      );
      return holder;
    }

    /** Aserta una excepción de dominio: estado HTTP y `reason`. */
    async function expectDomainError(
      promise: Promise<unknown>,
      status: number,
      reason?: string,
    ): Promise<any> {
      let caught: any;
      try {
        await promise;
      } catch (error) {
        caught = error;
      }
      if (!caught)
        throw new Error('Se esperaba una excepción y no hubo ninguna');
      expect(caught.getStatus?.()).toBe(status);
      if (reason) expect(caught.reason).toBe(reason);
      return caught;
    }

    // ------------------------------------------------------------------- DDL
    it('el DDL aplicado es el real: las 4 tablas, el índice único de la clave de idempotencia y las claves foráneas internas', async () => {
      const unique = await rows(
        `select indexdef from pg_indexes where schemaname = 'payments' and indexname = 'uq_payment_intents_idempotency_key'`,
      );
      expect(unique).toHaveLength(1);
      expect(unique[0].indexdef).toMatch(/CREATE UNIQUE INDEX/u);
      expect(applied.tables).toHaveLength(TABLES.length);
      expect(applied.skippedFks.length).toBeGreaterThan(0);
      process.stdout.write(
        `DDL real aplicado: ${applied.tables.length} tablas, ${applied.indexes.length} índices, ${applied.fks.length} FK internas; FK omitidas: ${applied.skippedFks.join(', ')}\n`,
      );
    });

    // ------------------------------------------------------------- createIntent
    describe('createIntent con el flag encendido', () => {
      it('persiste la intención PENDIENTE, sin gatewayIntentRef, sin transacción local y SIN llamar a la pasarela', async () => {
        const c = await createIntent();

        const snap = await snapshot(c);
        expect(snap.intent).toMatchObject({
          status_concept_id: CONCEPTS.PI_PENDING,
          gateway_intent_ref: null,
          amount: '150.00',
        });
        expect(snap.transactions).toHaveLength(0);
        expect(double.calls).toHaveLength(0);
      });

      it.each([
        [
          'otra moneda (USD)',
          { currency: 'USD' as const },
          PaymentsErrorReason.PAYMENT_GATEWAY_CURRENCY_NOT_SUPPORTED,
        ],
        [
          'importe con fracción de centavo',
          { amount: '10.005' },
          PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_NOT_REPRESENTABLE,
        ],
        [
          'vencimiento a 30 s (menor que el mínimo de 60 s)',
          { expiresAt: new Date(Date.now() + 30_000).toISOString() },
          PaymentsErrorReason.PAYMENT_GATEWAY_EXPIRY_OUT_OF_RANGE,
        ],
      ])(
        '%s: 422 y la transacción se revierte, no queda ninguna fila',
        async (_name, over, reason) => {
          const dto = intentDto(over);

          await expectDomainError(
            on.intents.createIntent(dto, actor),
            422,
            reason,
          );

          const left = await rows(
            `select count(*)::int as n from payments.payment_intents where idempotency_key = ?`,
            [dto.idempotencyKey],
          );
          expect(left[0].n).toBe(0);
          expect(double.calls).toHaveLength(0);
        },
      );

      it('repetir la misma clave devuelve la intención existente (reused) y no crea otra fila', async () => {
        const dto = intentDto();
        const first = await on.intents.createIntent(dto, actor);
        const second = await on.intents.createIntent(dto, actor);

        expect(first.id).toBe(second.id);
        expect(
          (
            await rows(
              `select count(*)::int as n from payments.payment_intents where idempotency_key = ?`,
              [dto.idempotencyKey],
            )
          )[0].n,
        ).toBe(1);
        expect(double.calls).toHaveLength(0);
      });

      it('6 createIntent CONCURRENTES con la misma clave: queda UNA sola fila (el índice único del motor decide) y nadie llama a la pasarela', async () => {
        const dto = intentDto();

        const results = await Promise.allSettled(
          Array.from({ length: 6 }, () => on.intents.createIntent(dto, actor)),
        );

        const count = (
          await rows(
            `select count(*)::int as n from payments.payment_intents where idempotency_key = ?`,
            [dto.idempotencyKey],
          )
        )[0].n;
        process.stdout.write(
          `createIntent x6 misma clave: ${results.filter((r) => r.status === 'fulfilled').length} resueltas, rechazadas: ${results
            .filter((r) => r.status === 'rejected')
            .map(
              (r) =>
                (r as PromiseRejectedResult).reason?.code ??
                (r as PromiseRejectedResult).reason?.constructor?.name,
            )
            .join(',')}\n`,
        );
        expect(count).toBe(1);
        // Ninguna respuesta apunta a una intención que no existe.
        const row = await rows(
          `select id from payments.payment_intents where idempotency_key = ?`,
          [dto.idempotencyKey],
        );
        for (const r of results) {
          if (r.status === 'fulfilled') expect(r.value.id).toBe(row[0].id);
        }
        expect(double.calls).toHaveLength(0);
      });
    });

    // -------------------------------------------------------- (1) cobro feliz
    describe('(1) cobro feliz', () => {
      it('la intención queda con gatewayIntentRef persistido, estado coherente y SIN transacción local', async () => {
        const c = await approved();
        const before = await snapshot(c);
        expect(before.intent.gateway_intent_ref).toBeNull();

        const res = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );

        expect(res).toMatchObject({
          id: c.id,
          paymentIntentId: c.id,
          amount: AMOUNT,
          statusConceptId: CONCEPTS.PI_PENDING,
          gateway: { status: 'requires_action' },
        });
        expect(res.gatewayTransactionRef).toMatch(/^pi_dbl\d+$/u);
        expect(res.gateway?.nextAction).toMatchObject({ type: 'display_qr' });

        // Persistido de verdad (se lee con otra consulta, no con la entidad devuelta).
        const after = await snapshot(c);
        expect(after.intent.gateway_intent_ref).toBe(res.gatewayTransactionRef);
        expect(after.intent.status_concept_id).toBe(CONCEPTS.PI_PENDING);
        expect(after.intent.row_version).toBeGreaterThan(
          before.intent.row_version,
        );
        expect(after.transactions).toHaveLength(0);

        // Hacia la pasarela: una sola creación, con la clave determinista y el cuerpo mínimo.
        expect(double.createdCount).toBe(1);
        const posts = postsFor(c);
        expect(posts).toHaveLength(1);
        expect(posts[0].body).toEqual({
          amount_minor: AMOUNT_MINOR,
          currency: 'BOB',
          payment_method: { type: 'qr' },
        });
        // Lo que viaja: cuerpos y claves. `X-Request-Id` lleva el id local como correlación (un UUID, sin datos de personas).
        const wire = JSON.stringify(
          double.calls.map((call) => [call.body, call.idempotencyKey]),
        );
        for (const secret of [c.id, TENANT, c.sourceRefId, c.idempotencyKey]) {
          expect(wire).not.toContain(secret);
        }
      });

      it('repetir processTransaction sobre la intención ya despachada CONSULTA (GET) y no crea otro cobro ni toca la fila', async () => {
        const c = await approved();
        const first = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );
        const mid = await snapshot(c);

        const again = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );

        expect(again.gatewayTransactionRef).toBe(first.gatewayTransactionRef);
        expect(postsFor(c)).toHaveLength(1);
        expect(double.createdCount).toBe(1);
        expect(getsFor(first.gatewayTransactionRef as string)).toHaveLength(1);
        const end = await snapshot(c);
        expect(end.intent.row_version).toBe(mid.intent.row_version);
        expect(end.transactions).toHaveLength(0);
      });

      it('una intención ya despachada no se vuelve a evaluar: tras `processing` (webhook) y una evaluación REVIEW posterior, reintentar CONSULTA (200), no da 409 ni 422 ni crea otro cobro', async () => {
        const c = await approved();
        const first = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );
        // Lo que dejaría el webhook `processing` (se simula el efecto sobre la fila, no el webhook).
        await run(
          `update payments.payment_intents set status_concept_id = ? where id = ?`,
          [CONCEPTS.PI_PROCESSING, c.id],
        );
        await assess(c.id, 'REVIEW', '60');

        const again = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );

        expect(again.gatewayTransactionRef).toBe(first.gatewayTransactionRef);
        expect(again.statusConceptId).toBe(CONCEPTS.PI_PROCESSING);
        expect(postsFor(c)).toHaveLength(1);
        expect(double.createdCount).toBe(1);
        expect(getsFor(first.gatewayTransactionRef as string)).toHaveLength(1);
      });
    });

    // ------------------------------------------------ (2) concurrencia
    describe('(2) processTransaction CONCURRENTES sobre la misma intención', () => {
      it('2 en paralelo, 12 rondas con intenciones nuevas: UNA sola creación en la pasarela y un solo gatewayIntentRef', async () => {
        let maxPosts = 0;
        for (let round = 0; round < 12; round += 1) {
          const c = await approved();
          double.calls.length = 0;
          double.created.clear();

          const results = await Promise.allSettled([
            on.transactions.processTransaction(c.id, sale(), actor),
            on.transactions.processTransaction(c.id, sale(), actor),
          ]);

          expect(
            results
              .filter((r) => r.status === 'rejected')
              .map((r) => String((r as PromiseRejectedResult).reason)),
          ).toEqual([]);
          const refs = results.map(
            (r) =>
              (r as PromiseFulfilledResult<any>).value
                .gatewayTransactionRef as string,
          );
          // Una sola creación real; todas las llamadas llevan LA misma clave.
          expect(double.createdCount).toBe(1);
          expect([...double.created.keys()]).toEqual([c.gatewayKey]);
          expect(
            new Set(double.postCalls.map((p) => p.idempotencyKey)),
          ).toEqual(new Set([c.gatewayKey]));
          maxPosts = Math.max(maxPosts, double.postCalls.length);
          const piRef = double.created.get(c.gatewayKey)?.intent.id;
          expect(new Set(refs)).toEqual(new Set([piRef]));
          const snap = await snapshot(c);
          expect(snap.intent.gateway_intent_ref).toBe(piRef);
          expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_PENDING);
          expect(snap.transactions).toHaveLength(0);
        }
        process.stdout.write(
          `(2) máximo de POST a la pasarela en una ronda de 2 concurrentes: ${maxPosts} (siempre la misma clave; creación única)\n`,
        );
      });

      it('8 en paralelo sobre la misma intención: una sola creación y un solo gatewayIntentRef', async () => {
        const c = await approved();

        const results = await Promise.allSettled(
          Array.from({ length: 8 }, () =>
            on.transactions.processTransaction(c.id, sale(), actor),
          ),
        );

        expect(
          results
            .filter((r) => r.status === 'rejected')
            .map((r) => String((r as PromiseRejectedResult).reason)),
        ).toEqual([]);
        expect(double.createdCount).toBe(1);
        expect(new Set(double.postCalls.map((p) => p.idempotencyKey))).toEqual(
          new Set([c.gatewayKey]),
        );
        const piRef = double.created.get(c.gatewayKey)?.intent.id;
        const snap = await snapshot(c);
        expect(snap.intent.gateway_intent_ref).toBe(piRef);
        expect(snap.transactions).toHaveLength(0);
      });

      it('la compuerta serializa por FOR UPDATE: con la fila retenida por otra transacción, processTransaction ESPERA, y al soltarla ve la operación abierta recién escrita (409, cero llamadas)', async () => {
        const c = await approved();
        const holder = await holdIntentLock(c);
        try {
          const settled = on.transactions
            .processTransaction(c.id, sale(), actor)
            .then(
              (value) => ({ value }),
              (error: unknown) => ({ error }),
            );
          await waitUntilBlocked(settled);
          // Mientras espera, la pasarela no recibió nada.
          expect(double.calls).toHaveLength(0);

          // La otra transacción registra una operación abierta y confirma.
          await insertTransaction(c, CONCEPTS.TXN_PROCESSING, AMOUNT, holder);
          await holder.query('commit');

          const outcome = await settled;
          expect('error' in outcome).toBe(true);
          expect((outcome as any).error.getStatus()).toBe(409);
          expect(double.calls).toHaveLength(0);
          expect((await snapshot(c)).intent.gateway_intent_ref).toBeNull();
        } finally {
          await holder.query('rollback').catch(() => undefined);
          await holder.end();
        }
      });

      it('la asociación del pi_… serializa por FOR UPDATE y no pisa una referencia distinta ya asociada (409, la fila conserva la otra)', async () => {
        const c = await approved();
        const entity = await orm.em.fork().findOneOrFail(PaymentIntents, c.id);
        const holder = await holdIntentLock(c);
        try {
          // La pasarela SÍ recibe el cobro; la asociación local queda esperando el bloqueo.
          const settled = on.charge.dispatch(entity, 'qr').then(
            (value) => ({ value }),
            (error: unknown) => ({ error }),
          );
          await waitUntilBlocked(settled);
          expect(double.createdCount).toBe(1);

          // Mientras tanto otro actor asoció OTRO cobro a la intención.
          await holder.query(
            'update payments.payment_intents set gateway_intent_ref = $1, row_version = row_version + 1 where id = $2',
            ['pi_otrocobro0000001', c.id],
          );
          await holder.query('commit');

          const outcome = await settled;
          expect('error' in outcome).toBe(true);
          expect((outcome as any).error.getStatus()).toBe(409);
          expect((outcome as any).error.reason).toBe(
            PaymentsErrorReason.PAYMENT_GATEWAY_RESPONSE_MISMATCH,
          );
          expect((await snapshot(c)).intent.gateway_intent_ref).toBe(
            'pi_otrocobro0000001',
          );
        } finally {
          await holder.query('rollback').catch(() => undefined);
          await holder.end();
        }
      });
    });

    // ------------------------------------------------ (3) resultado ambiguo
    describe('(3) reintento tras resultado ambiguo', () => {
      it('un corte DESPUÉS de ejecutar que el propio cliente reintenta con la misma clave: un cobro, dos POST', async () => {
        const c = await approved();
        double.script = [{ kind: 'execute_then_drop' }];

        const res = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );

        expect(double.createdCount).toBe(1);
        expect(postsFor(c)).toHaveLength(2);
        expect(double.postCalls).toHaveLength(2);
        expect((await snapshot(c)).intent.gateway_intent_ref).toBe(
          res.gatewayTransactionRef,
        );
      });

      it.each([
        ['corte de conexión después de ejecutar', 'execute_then_drop'],
        ['502 después de ejecutar', 'execute_then_status'],
      ] as const)(
        '%s, intentos agotados: 504 ambiguo, la intención queda PENDIENTE y sin anular; reintentar usa la MISMA clave, recupera el MISMO cobro y no hay segundo cobro',
        async (_name, kind) => {
          const c = await approved();
          const fault =
            kind === 'execute_then_drop'
              ? ({ kind } as const)
              : ({ kind, status: 502 } as const);
          double.script = [fault, fault, fault];

          await expectDomainError(
            on.transactions.processTransaction(c.id, sale(), actor),
            504,
            PaymentsErrorReason.PAYMENT_GATEWAY_RESULT_AMBIGUOUS,
          );

          // La pasarela SÍ creó el cobro; la API no lo sabe y no lo da por perdido.
          expect(double.createdCount).toBe(1);
          expect(postsFor(c)).toHaveLength(3);
          const ambiguous = await snapshot(c);
          expect(ambiguous.intent.gateway_intent_ref).toBeNull();
          expect(ambiguous.intent.status_concept_id).toBe(CONCEPTS.PI_PENDING);
          expect(ambiguous.transactions).toHaveLength(0);

          // El reintento del cliente se retoma con la misma clave.
          const res = await on.transactions.processTransaction(
            c.id,
            sale(),
            actor,
          );

          const created = double.created.get(c.gatewayKey)?.intent.id;
          expect(res.gatewayTransactionRef).toBe(created);
          expect(double.createdCount).toBe(1);
          expect(postsFor(c)).toHaveLength(4);
          expect(
            new Set(double.postCalls.map((p) => p.idempotencyKey)),
          ).toEqual(new Set([c.gatewayKey]));
          const recovered = await snapshot(c);
          expect(recovered.intent.gateway_intent_ref).toBe(created);
          expect(recovered.intent.status_concept_id).toBe(CONCEPTS.PI_PENDING);
          expect(recovered.transactions).toHaveLength(0);
        },
      );

      it('un corte ANTES de ejecutar, intentos agotados: 504 y nada creado; el reintento crea UN cobro con la misma clave', async () => {
        const c = await approved();
        double.script = [
          { kind: 'drop_before' },
          { kind: 'drop_before' },
          { kind: 'drop_before' },
        ];

        await expectDomainError(
          on.transactions.processTransaction(c.id, sale(), actor),
          504,
          PaymentsErrorReason.PAYMENT_GATEWAY_RESULT_AMBIGUOUS,
        );
        expect(double.createdCount).toBe(0);
        expect((await snapshot(c)).intent.gateway_intent_ref).toBeNull();

        const res = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );

        expect(double.createdCount).toBe(1);
        expect([...double.created.keys()]).toEqual([c.gatewayKey]);
        expect((await snapshot(c)).intent.gateway_intent_ref).toBe(
          res.gatewayTransactionRef,
        );
      });

      it('un rechazo definitivo del contrato (422) NO es ambiguo: 422 del contrato propio, la intención sigue pendiente y reintentable', async () => {
        const c = await approved();
        double.script = [
          { kind: 'status', status: 422, code: 'validation_failed' },
        ];

        await expectDomainError(
          on.transactions.processTransaction(c.id, sale(), actor),
          422,
          PaymentsErrorReason.PAYMENT_GATEWAY_REJECTED,
        );

        expect(postsFor(c)).toHaveLength(1); // 422 no se reintenta
        expect(double.createdCount).toBe(0);
        expect((await snapshot(c)).intent.gateway_intent_ref).toBeNull();
        const res = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );
        expect(res.gatewayTransactionRef).toMatch(/^pi_dbl/u);
      });
    });

    // ------------------------------------------- (4) operación abierta
    describe('(4) operación abierta: 409 y cero llamadas a la pasarela', () => {
      it.each([
        ['PROCESSING', CONCEPTS.TXN_PROCESSING],
        ['AUTHORIZED (una venta no la reemplaza)', CONCEPTS.TXN_AUTHORIZED],
      ])(
        'transacción local %s con la intención aún pendiente',
        async (_name, status) => {
          const c = await approved();
          const txnId = await insertTransaction(c, status, AMOUNT);

          const error = await expectDomainError(
            on.transactions.processTransaction(c.id, sale(), actor),
            409,
          );

          expect(error.details).toMatchObject({
            intentId: c.id,
            transactionId: txnId,
          });
          expect(double.calls).toHaveLength(0);
          const snap = await snapshot(c);
          expect(snap.intent.gateway_intent_ref).toBeNull();
          expect(snap.transactions).toHaveLength(1);
        },
      );

      it('la operación abierta por el camino de siempre (intención PI_PROCESSING sin cobro en la pasarela) tampoco se cobra otra vez', async () => {
        const c = await approved();
        await off.transactions.processTransaction(c.id, sale(), actor); // flag apagado: abre la operación local

        await expectDomainError(
          on.transactions.processTransaction(c.id, sale(), actor),
          409,
          PaymentsErrorReason.PAYMENT_INTENT_ALREADY_PROCESSING,
        );

        expect(double.calls).toHaveLength(0);
        expect((await snapshot(c)).transactions).toHaveLength(1);
      });
    });

    // ------------------------------------------------ (5) saldo previo
    describe('(5) saldo / capturado previo: no despacha', () => {
      it.each([
        ['capturado parcial (50.00 de 150.00)', CONCEPTS.TXN_CAPTURED, '50.00'],
        ['liquidado parcial (50.00 de 150.00)', CONCEPTS.TXN_SETTLED, '50.00'],
        ['capturado completo (150.00)', CONCEPTS.TXN_CAPTURED, '150.00'],
      ])(
        '%s: 409 por exceder el saldo, cero llamadas',
        async (_n, status, paid) => {
          const c = await approved();
          await insertTransaction(c, status, paid);

          const error = await expectDomainError(
            on.transactions.processTransaction(c.id, sale(), actor),
            409,
          );

          expect(error.details).toMatchObject({ intentId: c.id });
          expect(error.details.captured).toBeDefined();
          expect(double.calls).toHaveLength(0);
          expect((await snapshot(c)).intent.gateway_intent_ref).toBeNull();
        },
      );

      it('una transacción previa FALLIDA no es dinero capturado: no bloquea el cobro', async () => {
        const c = await approved();
        await insertTransaction(c, CONCEPTS.TXN_FAILED, AMOUNT);

        const res = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );

        expect(res.gatewayTransactionRef).toMatch(/^pi_dbl/u);
        expect(double.createdCount).toBe(1);
      });
    });

    // ------------------------------------------------ (6) riesgo
    describe('(6) compuerta de riesgo', () => {
      it('sin evaluación: 422 y la pasarela no recibe nada', async () => {
        const c = await createIntent();
        expect((await snapshot(c)).risks).toHaveLength(0);

        await expectDomainError(
          on.transactions.processTransaction(c.id, sale(), actor),
          422,
          PaymentsErrorReason.PAYMENT_INTENT_RISK_ASSESSMENT_MISSING,
        );

        expect(double.calls).toHaveLength(0);
        expect((await snapshot(c)).intent.gateway_intent_ref).toBeNull();
      });

      it('DECLINE (evaluación real persistida): 422 y la pasarela no recibe nada', async () => {
        const c = await createIntent();
        await assess(c.id, 'DECLINE', '95');
        expect((await snapshot(c)).risks).toEqual([
          { decision_concept_id: CONCEPTS.RISK_DECLINE },
        ]);

        await expectDomainError(
          on.transactions.processTransaction(c.id, sale(), actor),
          422,
          PaymentsErrorReason.PAYMENT_INTENT_RISK_DECLINED,
        );

        expect(double.calls).toHaveLength(0);
        expect((await snapshot(c)).intent.gateway_intent_ref).toBeNull();
      });

      it('REVIEW: 422 con la pasarela encendida (supuesto conservador) y la pasarela no recibe nada', async () => {
        const c = await createIntent();
        await assess(c.id, 'REVIEW', '55');

        await expectDomainError(
          on.transactions.processTransaction(c.id, sale(), actor),
          422,
          PaymentsErrorReason.PAYMENT_INTENT_RISK_REVIEW_PENDING,
        );

        expect(double.calls).toHaveLength(0);
      });

      it('APPROVE: despacha', async () => {
        const c = await createIntent();
        await assess(c.id, 'APPROVE');

        const res = await on.transactions.processTransaction(
          c.id,
          sale(),
          actor,
        );

        expect(res.gatewayTransactionRef).toMatch(/^pi_dbl/u);
        expect(postsFor(c)).toHaveLength(1);
      });

      it('gobierna la ÚLTIMA evaluación: APPROVE y después REVIEW bloquea; REVIEW y después APPROVE despacha', async () => {
        const blocked = await createIntent();
        await assess(blocked.id, 'APPROVE');
        await assess(blocked.id, 'REVIEW', '60');
        // El orden lo fija assessed_at; se separan las evaluaciones para no depender del milisegundo.
        await run(
          `update payments.risk_assessments set assessed_at = now() - interval '1 hour'
          where payment_intent_id = ? and decision_concept_id = ?`,
          [blocked.id, CONCEPTS.RISK_APPROVE],
        );
        await expectDomainError(
          on.transactions.processTransaction(blocked.id, sale(), actor),
          422,
          PaymentsErrorReason.PAYMENT_INTENT_RISK_REVIEW_PENDING,
        );
        expect(postsFor(blocked)).toHaveLength(0);

        const cleared = await createIntent();
        await assess(cleared.id, 'REVIEW', '60');
        await assess(cleared.id, 'APPROVE');
        await run(
          `update payments.risk_assessments set assessed_at = now() - interval '1 hour'
          where payment_intent_id = ? and decision_concept_id = ?`,
          [cleared.id, CONCEPTS.RISK_REVIEW],
        );
        const res = await on.transactions.processTransaction(
          cleared.id,
          sale(),
          actor,
        );
        expect(res.gatewayTransactionRef).toMatch(/^pi_dbl/u);
        expect(postsFor(cleared)).toHaveLength(1);
      });
    });

    // -------------------------------------------- otras compuertas del cobro
    describe('otras compuertas del cobro por la pasarela (cero llamadas)', () => {
      it('operación distinta de SALE: 422', async () => {
        const c = await approved();
        await expectDomainError(
          on.transactions.processTransaction(
            c.id,
            sale({ operation: 'AUTHORIZE' }),
            actor,
          ),
          422,
          PaymentsErrorReason.PAYMENT_GATEWAY_OPERATION_NOT_SUPPORTED,
        );
        expect(double.calls).toHaveLength(0);
      });

      it('importe distinto del de la intención: 422', async () => {
        const c = await approved();
        await expectDomainError(
          on.transactions.processTransaction(
            c.id,
            sale({ amount: '100.00' }),
            actor,
          ),
          422,
          PaymentsErrorReason.PAYMENT_GATEWAY_AMOUNT_MUST_MATCH_INTENT,
        );
        expect(double.calls).toHaveLength(0);
      });

      it('sin paymentMethodType: 422 y la intención no se toca', async () => {
        const c = await approved();
        await expectDomainError(
          on.transactions.processTransaction(
            c.id,
            sale({ paymentMethodType: undefined }),
            actor,
          ),
          422,
          PaymentsErrorReason.PAYMENT_GATEWAY_METHOD_REQUIRED,
        );
        expect(double.calls).toHaveLength(0);
        expect((await snapshot(c)).intent.gateway_intent_ref).toBeNull();
      });

      it.each([
        [
          'ya cobrada',
          CONCEPTS.PI_SUCCEEDED,
          409,
          PaymentsErrorReason.PAYMENT_INTENT_ALREADY_SUCCEEDED,
        ],
        [
          'cancelada',
          CONCEPTS.PI_CANCELED,
          422,
          PaymentsErrorReason.PAYMENT_INTENT_CANCELED,
        ],
      ])(
        'intención %s: HTTP %s sin llamar a la pasarela',
        async (_n, status, http, reason) => {
          const c = await approved();
          await run(
            `update payments.payment_intents set status_concept_id = ? where id = ?`,
            [status, c.id],
          );

          await expectDomainError(
            on.transactions.processTransaction(c.id, sale(), actor),
            http,
            reason,
          );

          expect(double.calls).toHaveLength(0);
        },
      );

      it('intención inexistente: 404', async () => {
        await expectDomainError(
          on.transactions.processTransaction(randomUUID(), sale(), actor),
          404,
          PaymentsErrorReason.PAYMENT_INTENT_NOT_FOUND,
        );
        expect(double.calls).toHaveLength(0);
      });
    });

    // ------------------------------------------------ (7) flag apagado
    describe('(7) flag apagado: el camino de siempre no llama a la pasarela y no cambia', () => {
      it('createIntent acepta lo que la pasarela no podría cobrar (USD) y no llama a nadie', async () => {
        const c = await createIntent(off, { currency: 'USD' });

        const snap = await snapshot(c);
        expect(snap.intent.status_concept_id).toBe(CONCEPTS.PI_PENDING);
        expect(snap.intent.gateway_intent_ref).toBeNull();
        expect(double.calls).toHaveLength(0);
      });

      it('processTransaction registra la operación local PROCESSING, la intención pasa a PI_PROCESSING, sin gatewayIntentRef y con CERO llamadas', async () => {
        const c = await createIntent(off);
        await off.intents.assessRisk(
          c.id,
          { riskScore: '10', decision: 'REVIEW' },
          actor,
        );

        const res = await off.transactions.processTransaction(
          c.id,
          { operation: 'AUTHORIZE', amount: '100.00' },
          actor,
        );

        // REVIEW pasa y AUTHORIZE/parcial se admiten: es el comportamiento previo, intacto.
        expect(res.statusConceptId).toBe(CONCEPTS.TXN_PROCESSING);
        expect(res.amount).toBe('100.00');
        expect(res.gateway).toBeUndefined();
        const snap = await snapshot(c);
        expect(snap.intent).toMatchObject({
          status_concept_id: CONCEPTS.PI_PROCESSING,
          gateway_intent_ref: null,
        });
        expect(snap.transactions).toEqual([
          expect.objectContaining({
            status_concept_id: CONCEPTS.TXN_PROCESSING,
            amount: '100.00',
          }),
        ]);
        expect(double.calls).toHaveLength(0);
      });

      it('una operación abierta sigue bloqueando otra por el camino de siempre (409) y la pasarela sigue sin recibir nada', async () => {
        const c = await createIntent(off);
        await off.intents.assessRisk(
          c.id,
          { riskScore: '10', decision: 'APPROVE' },
          actor,
        );
        await off.transactions.processTransaction(c.id, sale(), actor);

        await expectDomainError(
          off.transactions.processTransaction(c.id, sale(), actor),
          409,
        );
        expect(double.calls).toHaveLength(0);
        expect((await snapshot(c)).transactions).toHaveLength(1);
      });

      it('una intención ya cobrada por la pasarela no abre un segundo camino contra el proveedor: 409 PAYMENT_INTENT_VIA_GATEWAY y sin transacción local', async () => {
        const c = await approved();
        await on.transactions.processTransaction(c.id, sale(), actor);
        const calls = double.calls.length;

        await expectDomainError(
          off.transactions.processTransaction(c.id, sale(), actor),
          409,
          PaymentsErrorReason.PAYMENT_INTENT_VIA_GATEWAY,
        );

        expect(double.calls).toHaveLength(calls);
        expect((await snapshot(c)).transactions).toHaveLength(0);
      });
    });
  },
);
