import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { EntityManager } from '@mikro-orm/postgresql';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { CONCEPTS } from '../../../common';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../../common/auth/jwt.strategy';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { SessionValidator } from '../../../common/auth/session-validator';
import { TenantScopeGuard } from '../../../common/auth/tenant-scope.guard';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { TenantContextInterceptor } from '../../../common/tenant/tenant-context.interceptor';
import { PaymentsIntentsController } from './payments-intents.controller';
import { PaymentsIntentsService } from '../services/payments-intents.service';
import { PaymentsTransactionsService } from '../services/payments-transactions.service';
import { PaymentsGatewayChargeService } from '../services/payments-gateway-charge.service';

/**
 * Matriz de autorización NEGATIVA de `POST /payments/intents/:id/transactions`
 * con `payments.via_gateway` encendido (hallazgo M3): la cadena REAL de guards
 * e interceptor (`JwtAuthGuard` con `JwtStrategy`, `TenantScopeGuard`,
 * `RolesGuard`, `TenantContextInterceptor`), el controlador real y el
 * `PaymentsTransactionsService` real sobre repositorios en memoria.
 *
 * El único colaborador simulado es la pasarela (`dispatch`/`consult`): lo que se
 * afirma en cada caso rechazado es que NO recibió ninguna llamada, es decir, que
 * no se creó un cobro real ni se devolvió el QR o la cuenta de una intención
 * ajena. La sesión (`SessionValidator`) es un doble que acepta la sesión.
 *
 * `RLS_ENFORCE` queda sin definir (el defecto): la barrera tiene que ser del
 * servicio, no de la base.
 */

const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const INTENT_OF_B = randomUUID();
const DEBT_OF_B = randomUUID();

describe('POST /payments/intents/:id/transactions (via_gateway) — autorización negativa', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const dispatch = jest.fn(async (_i: unknown, _m: unknown) => ({
    gatewayIntentRef: 'pi_abcdefghij12',
    gatewayStatus: 'requires_action',
    localStatusConceptId: CONCEPTS.PI_PENDING,
    replayed: false,
  }));
  const consult = jest.fn(async () => ({
    gatewayIntentRef: 'pi_abcdefghij12',
    gatewayStatus: 'requires_action',
    localStatusConceptId: CONCEPTS.PI_PENDING,
    replayed: true,
  }));

  const intentOfB = {
    id: INTENT_OF_B,
    tenantId: TENANT_B,
    amount: '150.00',
    currencyConceptId: CONCEPTS.CURRENCY_BOB,
    statusConceptId: CONCEPTS.PI_PENDING,
    idempotencyKey: 'k-b',
    sourceRefType: 'payment_debt',
    sourceRefId: DEBT_OF_B,
    createdAt: new Date(),
  };
  const debtOfB = {
    id: DEBT_OF_B,
    tenantId: TENANT_B,
    currencyCode: 'BOB',
    outstandingAmount: '150.000000',
    statusConceptId: CONCEPTS.DEBT_PENDING,
  };

  beforeAll(async () => {
    const logger = {
      setContext: () => undefined,
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
    };
    const em = {
      isInTransaction: () => false,
      transactional: async (cb: (tx: unknown) => unknown) => cb({}),
    };
    const intentsRepo = {
      // Como el repositorio real: por UUID, sin mirar el tenant.
      findByIdForUpdate: async (_tx: unknown, id: string) =>
        id === INTENT_OF_B ? intentOfB : null,
      // Con el tenant en el mismo `WHERE`, la fila del tenant B no se devuelve a A.
      findByIdAndTenantForUpdate: async (
        _tx: unknown,
        id: string,
        tenantId: string,
      ) =>
        id === INTENT_OF_B && intentOfB.tenantId === tenantId
          ? intentOfB
          : null,
    };
    const flowRepo = {
      findLatestRiskAssessment: async () => ({
        decisionConceptId: CONCEPTS.RISK_APPROVE,
      }),
      findCheckoutSessionsByIntentForUpdate: async () => [],
      findDebtByIdForUpdate: async (_tx: unknown, id: string) =>
        id === DEBT_OF_B ? debtOfB : null,
      findInFlightGatewayIntentsOnDebt: async () => [],
    };
    const transactionsRepo = {
      findPendingByIntent: async () => null,
      findByIntent: async () => [],
    };
    const charge = {
      enabled: true,
      dispatchLeaseMs: 900_000,
      buildCreateRequest: () => ({}),
      reserveDispatch: () => undefined,
      dispatch,
      consult,
    };
    const transactions = new PaymentsTransactionsService(
      em as never,
      intentsRepo as never,
      flowRepo as never,
      transactionsRepo as never,
      logger as never,
      charge as unknown as PaymentsGatewayChargeService,
    );

    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [PaymentsIntentsController],
      providers: [
        JwtService,
        JwtStrategy,
        {
          provide: SessionValidator,
          useValue: { assertActive: async () => undefined },
        },
        { provide: PaymentsIntentsService, useValue: {} },
        { provide: PaymentsTransactionsService, useValue: transactions },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: TenantScopeGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: EntityManager, useValue: {} },
        { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    dispatch.mockClear();
    consult.mockClear();
  });

  function token(over: {
    roles: string[];
    tenants: string[];
    scopedRoles?: Record<string, string[]>;
  }): string {
    return jwt.sign(
      {
        sub: randomUUID(),
        sid: randomUUID(),
        typ: 'access',
        roles: over.roles,
        tenants: over.tenants,
        scopedRoles: over.scopedRoles,
      },
      {
        secret: 'dev-only-insecure-secret-change-me',
        algorithm: 'HS256',
        expiresIn: '5m',
      },
    );
  }

  const post = (jwtToken?: string, tenantHeader?: string) => {
    let req = request(app.getHttpServer()).post(
      `/payments/intents/${INTENT_OF_B}/transactions`,
    );
    if (jwtToken) req = req.set('Authorization', `Bearer ${jwtToken}`);
    if (tenantHeader) req = req.set('X-Tenant-Id', tenantHeader);
    return req.send({ operation: 'SALE', paymentMethodType: 'bank_transfer' });
  };

  const noGatewayCall = () => {
    expect(dispatch).not.toHaveBeenCalled();
    expect(consult).not.toHaveBeenCalled();
  };

  it('sin token: 401 y la pasarela no recibe nada', async () => {
    const res = await post();
    expect(res.status).toBe(401);
    noGatewayCall();
  });

  it('token firmado con otro secreto: 401', async () => {
    const forged = new JwtService().sign(
      {
        sub: randomUUID(),
        sid: randomUUID(),
        typ: 'access',
        roles: ['CASHIER'],
        tenants: [TENANT_B],
      },
      { secret: 'otro-secreto-que-no-es-el-del-servidor-0123456789' },
    );
    const res = await post(forged, TENANT_B);
    expect(res.status).toBe(401);
    noGatewayCall();
  });

  it('usuario SIN rol de pagos (PATIENT) en su propio tenant: 403 y cero llamadas', async () => {
    const res = await post(
      token({ roles: ['PATIENT'], tenants: [TENANT_A] }),
      TENANT_A,
    );
    expect(res.status).toBe(403);
    noGatewayCall();
  });

  it('el rol CASHIER acotado a OTRO tenant no autoriza en éste: 403 y cero llamadas', async () => {
    const res = await post(
      token({
        roles: ['CASHIER'],
        tenants: [TENANT_A, TENANT_B],
        scopedRoles: { [TENANT_B]: ['CASHIER'] },
      }),
      TENANT_A,
    );
    expect(res.status).toBe(403);
    noGatewayCall();
  });

  it('CASHIER del tenant A que declara X-Tenant-Id del tenant B (no es miembro): 403 y cero llamadas', async () => {
    const res = await post(
      token({ roles: ['CASHIER'], tenants: [TENANT_A] }),
      TENANT_B,
    );
    expect(res.status).toBe(403);
    noGatewayCall();
  });

  it('CASHIER del tenant A con el UUID de una intención del tenant B: 404 idéntico a «no existe», sin crear el cobro ni devolver su QR', async () => {
    const res = await post(
      token({ roles: ['CASHIER'], tenants: [TENANT_A] }),
      TENANT_A,
    );

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      reason: 'PAYMENT_INTENT_NOT_FOUND',
      message: 'Intención de pago no encontrada',
    });
    expect(res.body.details).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('pi_');
    noGatewayCall();

    const missing = await request(app.getHttpServer())
      .post(`/payments/intents/${randomUUID()}/transactions`)
      .set(
        'Authorization',
        `Bearer ${token({ roles: ['CASHIER'], tenants: [TENANT_A] })}`,
      )
      .set('X-Tenant-Id', TENANT_A)
      .send({ operation: 'SALE', paymentMethodType: 'bank_transfer' });
    expect(missing.status).toBe(404);
    expect(missing.body.reason).toBe(res.body.reason);
    expect(missing.body.message).toBe(res.body.message);
  });

  it('PAYMENTS_ADMIN del tenant A con el UUID de la intención del tenant B: 404 y cero llamadas', async () => {
    const res = await post(
      token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_A] }),
      TENANT_A,
    );
    expect(res.status).toBe(404);
    noGatewayCall();
  });

  it('control: el CASHIER del tenant dueño sí despacha (201)', async () => {
    const res = await post(
      token({ roles: ['CASHIER'], tenants: [TENANT_B] }),
      TENANT_B,
    );
    expect(res.status).toBe(201);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
