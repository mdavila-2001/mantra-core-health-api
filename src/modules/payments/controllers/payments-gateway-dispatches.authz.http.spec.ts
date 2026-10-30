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
import { PaymentsGatewayDispatchesController } from './payments-gateway-dispatches.controller';
import { PaymentsTransactionsService } from '../services/payments-transactions.service';
import { PaymentsGatewayChargeService } from '../services/payments-gateway-charge.service';
import { newDispatchMark } from '../gateway/payments-gateway-dispatch-mark';

/**
 * Matriz de autorización NEGATIVA de las rutas administrativas de las reservas de
 * despacho (`/payments/gateway-dispatches`), con la cadena REAL de guards e
 * interceptor (`JwtAuthGuard` con `JwtStrategy`, `TenantScopeGuard`, `RolesGuard`,
 * `TenantContextInterceptor`), el controlador real y el `PaymentsTransactionsService`
 * real sobre repositorios en memoria. La pasarela (`dispatch`/`consult`) es un
 * doble: lo que se afirma en los casos rechazados es que NO recibió llamadas y
 * que la intención del tenant B no se tocó. `RLS_ENFORCE` queda sin definir: la
 * barrera es del servicio, no de la base.
 */

const TENANT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const INTENT_OF_B = randomUUID();
const DEBT_OF_B = randomUUID();
const LEASE = 900_000;
const HOUR = 3_600_000;

describe('/payments/gateway-dispatches — autorización negativa', () => {
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

  const intentOfB: Record<string, any> = {};
  const resetIntent = (
    mark = newDispatchMark(Date.now() - 2 * HOUR),
    idleMs = 2 * HOUR,
  ) => {
    Object.assign(intentOfB, {
      id: INTENT_OF_B,
      tenantId: TENANT_B,
      amount: '150.00',
      currencyConceptId: CONCEPTS.CURRENCY_BOB,
      statusConceptId: CONCEPTS.PI_PENDING,
      idempotencyKey: 'k-b',
      sourceRefType: 'payment_debt',
      sourceRefId: DEBT_OF_B,
      gatewayIntentRef: mark,
      createdAt: new Date(),
      updatedAt: new Date(Date.now() - idleMs),
    });
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
      dispatchLeaseMs: LEASE,
      acquireDispatchSlot: () => () => undefined,
      buildCreateRequest: () => ({}),
      reserveDispatch: () => undefined,
      listDispatchesRequiringReconciliation: async (tenantId: string) =>
        tenantId === TENANT_B
          ? [{ intentId: INTENT_OF_B, ageMs: 2 * HOUR, canReconcile: true }]
          : [],
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
      controllers: [PaymentsGatewayDispatchesController],
      providers: [
        JwtService,
        JwtStrategy,
        {
          provide: SessionValidator,
          useValue: { assertActive: async () => undefined },
        },
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
    resetIntent();
  });

  const token = (over: {
    roles: string[];
    tenants: string[];
    scopedRoles?: Record<string, string[]>;
  }) =>
    jwt.sign(
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

  const routes: ReadonlyArray<
    [string, 'get' | 'post', string, Record<string, unknown> | undefined]
  > = [
    [
      'listado',
      'get',
      '/payments/gateway-dispatches/pending-reconciliation',
      undefined,
    ],
    [
      'conciliar',
      'post',
      `/payments/gateway-dispatches/${INTENT_OF_B}/reconcile`,
      { paymentMethodType: 'qr' },
    ],
    [
      'cerrar',
      'post',
      `/payments/gateway-dispatches/${INTENT_OF_B}/close`,
      { reason: 'Verificado en la consola de la pasarela: no hay cobro' },
    ],
  ];

  const call = (
    method: 'get' | 'post',
    path: string,
    body: Record<string, unknown> | undefined,
    jwtToken?: string,
    tenantHeader?: string,
  ) => {
    let req = request(app.getHttpServer())[method](path);
    if (jwtToken) req = req.set('Authorization', `Bearer ${jwtToken}`);
    if (tenantHeader) req = req.set('X-Tenant-Id', tenantHeader);
    return body ? req.send(body) : req;
  };

  const untouched = () => {
    expect(dispatch).not.toHaveBeenCalled();
    expect(consult).not.toHaveBeenCalled();
    expect(intentOfB.statusConceptId).toBe(CONCEPTS.PI_PENDING);
    expect(String(intentOfB.gatewayIntentRef)).toMatch(/^dispatching:/u);
  };

  describe.each(routes)('%s', (_name, method, path, body) => {
    it('sin token: 401', async () => {
      const res = await call(method, path, body);
      expect(res.status).toBe(401);
      untouched();
    });

    it('token firmado con otro secreto: 401', async () => {
      const forged = new JwtService().sign(
        {
          sub: randomUUID(),
          sid: randomUUID(),
          typ: 'access',
          roles: ['PAYMENTS_ADMIN'],
          tenants: [TENANT_B],
        },
        { secret: 'otro-secreto-que-no-es-el-del-servidor-0123456789' },
      );
      const res = await call(method, path, body, forged, TENANT_B);
      expect(res.status).toBe(401);
      untouched();
    });

    it.each([['PATIENT'], ['CASHIER']])(
      'rol %s en su propio tenant: 403',
      async (role) => {
        const res = await call(
          method,
          path,
          body,
          token({ roles: [role], tenants: [TENANT_B] }),
          TENANT_B,
        );
        expect(res.status).toBe(403);
        untouched();
      },
    );

    it('PAYMENTS_ADMIN acotado a OTRO tenant no autoriza en éste: 403', async () => {
      const res = await call(
        method,
        path,
        body,
        token({
          roles: ['PAYMENTS_ADMIN'],
          tenants: [TENANT_A, TENANT_B],
          scopedRoles: { [TENANT_B]: ['PAYMENTS_ADMIN'] },
        }),
        TENANT_A,
      );
      expect(res.status).toBe(403);
      untouched();
    });

    it('PAYMENTS_ADMIN del tenant A que declara X-Tenant-Id del tenant B (no es miembro): 403', async () => {
      const res = await call(
        method,
        path,
        body,
        token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_A] }),
        TENANT_B,
      );
      expect(res.status).toBe(403);
      untouched();
    });
  });

  it('listado: el PAYMENTS_ADMIN del tenant A NO ve las reservas del tenant B', async () => {
    const res = await call(
      'get',
      '/payments/gateway-dispatches/pending-reconciliation',
      undefined,
      token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_A] }),
      TENANT_A,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it.each([
    [
      'conciliar',
      `/payments/gateway-dispatches/${INTENT_OF_B}/reconcile`,
      { paymentMethodType: 'qr' },
    ],
    [
      'cerrar',
      `/payments/gateway-dispatches/${INTENT_OF_B}/close`,
      { reason: 'Verificado en la consola de la pasarela: no hay cobro' },
    ],
  ])(
    '%s con el UUID de la intención del tenant B desde el tenant A: 404 IDÉNTICO a «no existe» y la intención no se toca',
    async (_n, path, body) => {
      const admin = token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_A] });
      const res = await call('post', path, body, admin, TENANT_A);
      const missing = await call(
        'post',
        path.replace(INTENT_OF_B, randomUUID()),
        body,
        admin,
        TENANT_A,
      );

      expect(res.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(res.body.reason).toBe(missing.body.reason);
      expect(res.body.message).toBe(missing.body.message);
      expect(res.body.details).toBeUndefined();
      untouched();
    },
  );

  it('cerrar: un tenantId en el cuerpo se rechaza (nunca se toma del cuerpo)', async () => {
    const res = await call(
      'post',
      `/payments/gateway-dispatches/${INTENT_OF_B}/close`,
      {
        reason: 'Verificado en la consola de la pasarela: no hay cobro',
        tenantId: TENANT_B,
      },
      token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_A] }),
      TENANT_A,
    );
    expect([400, 403]).toContain(res.status);
    untouched();
  });

  it('cerrar: sin motivo o con un motivo corto es 400 (el motivo es obligatorio)', async () => {
    const admin = token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_B] });
    for (const body of [{}, { reason: 'corto' }, { reason: 'x'.repeat(301) }]) {
      const res = await call(
        'post',
        `/payments/gateway-dispatches/${INTENT_OF_B}/close`,
        body,
        admin,
        TENANT_B,
      );
      expect(res.status).toBe(400);
    }
    untouched();
  });

  it.each([
    ['un número', 12345678901234],
    ['un objeto', { a: 'xxxxxxxxxxxxxxxx' }],
    ['diez espacios', '          '],
    ['un JSON como texto', '{"a":"xxxxxxxxxxxxxxxx"}'],
    ['sólo dígitos', '12345678901234'],
    ['símbolos', '<<<<<<<<<<<<<<<<'],
  ])(
    'D11: el motivo %s se rechaza (400) y no se toca nada',
    async (_n, reason) => {
      const res = await call(
        'post',
        `/payments/gateway-dispatches/${INTENT_OF_B}/close`,
        { reason } as never,
        token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_B] }),
        TENANT_B,
      );
      expect(res.status).toBe(400);
      untouched();
    },
  );

  it('D11: un motivo con tildes y puntuación corriente se acepta (y se recorta)', async () => {
    const res = await call(
      'post',
      `/payments/gateway-dispatches/${INTENT_OF_B}/close`,
      { reason: '   Verificado en la consola: no hay cobro (sin QR).   ' },
      token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_B] }),
      TENANT_B,
    );
    expect(res.status).toBe(201);
  });

  it('D12: el segundo cierre responde 409 (ya cerrada) y la intención sigue cancelada', async () => {
    const admin = token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_B] });
    const path = `/payments/gateway-dispatches/${INTENT_OF_B}/close`;
    const body = {
      reason: 'Verificado en la consola de la pasarela: no hay cobro',
    };
    expect((await call('post', path, body, admin, TENANT_B)).status).toBe(201);
    const second = await call('post', path, body, admin, TENANT_B);
    expect(second.status).toBe(409);
    expect(second.body.reason).toBe('PAYMENT_GATEWAY_DISPATCH_ALREADY_CLOSED');
    expect(intentOfB.statusConceptId).toBe(CONCEPTS.PI_CANCELED);
  });

  it('conciliar: sin paymentMethodType válido es 400', async () => {
    const res = await call(
      'post',
      `/payments/gateway-dispatches/${INTENT_OF_B}/reconcile`,
      { paymentMethodType: 'bitcoin' },
      token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_B] }),
      TENANT_B,
    );
    expect(res.status).toBe(400);
    untouched();
  });

  describe('control: el PAYMENTS_ADMIN del tenant dueño', () => {
    const admin = () =>
      token({ roles: ['PAYMENTS_ADMIN'], tenants: [TENANT_B] });

    it('lista la reserva, sin datos de pacientes ni de pagadores', async () => {
      const res = await call(
        'get',
        '/payments/gateway-dispatches/pending-reconciliation',
        undefined,
        admin(),
        TENANT_B,
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual([
        {
          paymentIntentId: INTENT_OF_B,
          ageMs: 2 * HOUR,
          canReconcile: true,
        },
      ]);
    });

    it('cierra la reserva vencida: 201, la intención queda cancelada y la pasarela no recibe nada', async () => {
      const res = await call(
        'post',
        `/payments/gateway-dispatches/${INTENT_OF_B}/close`,
        { reason: 'Verificado en la consola de la pasarela: no hay cobro' },
        admin(),
        TENANT_B,
      );
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        paymentIntentId: INTENT_OF_B,
        statusConceptId: CONCEPTS.PI_CANCELED,
      });
      expect(intentOfB.statusConceptId).toBe(CONCEPTS.PI_CANCELED);
      expect(dispatch).not.toHaveBeenCalled();
      expect(consult).not.toHaveBeenCalled();
    });

    it('no cierra una reserva que puede seguir en vuelo: 409', async () => {
      resetIntent(newDispatchMark(Date.now() - 2 * HOUR), 0);
      const res = await call(
        'post',
        `/payments/gateway-dispatches/${INTENT_OF_B}/close`,
        { reason: 'Verificado en la consola de la pasarela: no hay cobro' },
        admin(),
        TENANT_B,
      );
      expect(res.status).toBe(409);
      expect(res.body.reason).toBe('PAYMENT_GATEWAY_DISPATCH_IN_FLIGHT');
      expect(intentOfB.statusConceptId).toBe(CONCEPTS.PI_PENDING);
    });

    it('concilia: 201 y reenvía la creación una sola vez', async () => {
      const res = await call(
        'post',
        `/payments/gateway-dispatches/${INTENT_OF_B}/reconcile`,
        { paymentMethodType: 'qr' },
        admin(),
        TENANT_B,
      );
      expect(res.status).toBe(201);
      expect(dispatch).toHaveBeenCalledTimes(1);
    });
  });
});
