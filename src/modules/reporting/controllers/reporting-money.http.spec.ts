import { jest } from '@jest/globals';
import {
  type CanActivate,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { NextFunction, Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { UnauthorizedException } from '../../../common';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { TenantScopeGuard } from '../../../common/auth/tenant-scope.guard';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../../common/http/validation-pipe';
import { TenantContextInterceptor } from '../../../common/tenant/tenant-context.interceptor';
import type { TracingService } from '../../../observability';
import { CONCEPTS } from '../../../common/constants/concepts';
import { ReportingMoneyRepository } from '../repositories/reporting-money.repository';
import { ReportingMoneyService } from '../services/reporting-money.service';
import {
  MONEY_READ_ROLES,
  ReportingMoneyController,
} from './reporting-money.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const QUERY = '?from=2026-10-01T00:00:00Z&to=2026-10-08T00:00:00Z';

/** Doble declarado de `JwtAuthGuard`: sin sujeto, 401 del contrato. */
class RequireUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: unknown }>();
    if (!req.user) throw new UnauthorizedException();
    return true;
  }
}

/**
 * `GET /admin/analytics/money` por HTTP: controlador y servicio reales, guards
 * (`TenantScopeGuard`, `RolesGuard`), interceptor de tenant, pipe de validación
 * y filtro de errores reales. Dobles declarados: el repositorio (sin Postgres)
 * y la autenticación JWT (`RequireUserGuard`).
 */
describe('GET /admin/analytics/money (contrato HTTP, repositorio doblado)', () => {
  let app: INestApplication;
  const aggregate = mockFn(async (source: { key: string }) =>
    source.key === 'billing.invoices'
      ? [
          {
            currency_concept_id: CONCEPTS.CURRENCY_BOB,
            currency_code: 'BOB',
            source_rows: 2,
            with_amount: 2,
            amount: '2500.80',
          },
          {
            currency_concept_id: CONCEPTS.CURRENCY_USD,
            currency_code: 'USD',
            source_rows: 1,
            with_amount: 1,
            amount: '40.00',
          },
        ]
      : [],
  );
  const logger = { setContext: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ReportingMoneyController],
      providers: [
        ReportingMoneyService,
        { provide: ReportingMoneyRepository, useValue: { aggregate } },
        { provide: APP_GUARD, useClass: RequireUserGuard },
        { provide: APP_GUARD, useClass: TenantScopeGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        {
          provide: APP_INTERCEPTOR,
          inject: [Reflector],
          useFactory: (reflector: Reflector) =>
            new TenantContextInterceptor({} as EntityManager, reflector),
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: Request, _res: Response, next: NextFunction) => {
      const header = req.headers['x-test-roles'];
      if (header !== undefined) {
        const roles = String(header).split(',').filter(Boolean);
        Object.assign(req, {
          user: { id: 'user-1', roles, tenantIds: [TENANT] },
        });
      }
      next();
    });
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(
      new AllExceptionsFilter(
        logger as unknown as PinoLogger,
        {
          setAttribute: jest.fn(),
          recordException: jest.fn(),
          addEvent: jest.fn(),
        } as unknown as TracingService,
      ),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => aggregate.mockClear());

  const get = (
    query: string,
    roles?: string,
    tenant: string | null = TENANT,
  ) => {
    const req = request(app.getHttpServer()).get(
      `/admin/analytics/money${query}`,
    );
    if (roles !== undefined) req.set('x-test-roles', roles);
    if (tenant) req.set('x-tenant-id', tenant);
    return req;
  };

  describe('Correcto', () => {
    it.each([...MONEY_READ_ROLES])(
      '%s → 200 con el contrato, importes como cadena y monedas separadas',
      async (role) => {
        const res = await get(QUERY, role).expect(200);

        expect(Object.keys(res.body).sort()).toEqual([
          'items',
          'notMeasured',
          'window',
        ]);
        expect(res.body.window).toEqual({
          from: '2026-10-01T00:00:00.000Z',
          to: '2026-10-08T00:00:00.000Z',
        });
        expect(res.body.items).toEqual([
          {
            module: 'billing',
            moduleLabel: 'Facturación',
            kind: 'FACTURADO',
            currency: 'BOB',
            operations: 2,
            amount: '2500.80',
          },
          {
            module: 'billing',
            moduleLabel: 'Facturación',
            kind: 'FACTURADO',
            currency: 'USD',
            operations: 1,
            amount: '40.00',
          },
        ]);
        for (const item of res.body.items) {
          expect(typeof item.amount).toBe('string');
          expect(item.amount).toMatch(/^-?\d+\.\d{2}$/);
        }
        expect(aggregate.mock.calls[0][1].tenantId).toBe(TENANT);
      },
    );

    it('vacío honesto: sin movimientos items es [] y los módulos sin fuente se declaran', async () => {
      const original = aggregate.getMockImplementation();
      aggregate.mockImplementation(async () => []);
      const res = await get(QUERY, 'PLATFORM_ADMIN').expect(200);
      aggregate.mockImplementation(original);
      expect(res.body.items).toEqual([]);
      expect(
        res.body.notMeasured.map((n: { module: string }) => n.module),
      ).toEqual(
        expect.arrayContaining(['pharmacy', 'insurance', 'accounting']),
      );
    });

    it('sin from/to usa la ventana por defecto (7 días) y responde 200', async () => {
      const res = await get('', 'PAYMENTS_ADMIN').expect(200);
      const from = new Date(res.body.window.from).getTime();
      const to = new Date(res.body.window.to).getTime();
      expect(to - from).toBe(7 * 86_400_000);
    });
  });

  describe('Error', () => {
    it('sin autenticación → 401 y no consulta', async () => {
      const res = await get(QUERY).expect(401);
      expect(res.body).toMatchObject({ code: 'UNAUTHENTICATED' });
      expect(aggregate).not.toHaveBeenCalled();
    });

    it.each(['PATIENT', 'PRACTITIONER', 'MARKETING_MANAGER', 'DPO'])(
      'rol %s → 403 ROLE_INSUFFICIENT y no consulta',
      async (role) => {
        const res = await get(QUERY, role).expect(403);
        expect(res.body).toMatchObject({
          code: 'FORBIDDEN',
          reason: 'ROLE_INSUFFICIENT',
        });
        expect(aggregate).not.toHaveBeenCalled();
      },
    );

    it.each([
      [
        'from posterior a to',
        '?from=2026-10-08T00:00:00Z&to=2026-10-01T00:00:00Z',
        'EMPTY_WINDOW',
      ],
      [
        'ventana > 92 días',
        '?from=2026-01-01T00:00:00Z&to=2026-10-01T00:00:00Z',
        'WINDOW_TOO_LARGE',
      ],
    ])(
      '%s → 422 VALIDATION_FAILED con reason, no 500',
      async (_n, q, reason) => {
        const res = await get(q, 'PLATFORM_ADMIN').expect(422);
        expect(res.body).toMatchObject({
          code: 'VALIDATION_FAILED',
          details: { reason },
        });
        expect(aggregate).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['from no ISO', '?from=ayer'],
      [
        'parámetro no declarado (interval no existe aquí)',
        `${QUERY}&interval=day`,
      ],
      ['moneda inyectada por la query', `${QUERY}&currency=USD`],
    ])('%s → 400 de validación, no 500', async (_n, q) => {
      const res = await get(q, 'PLATFORM_ADMIN').expect(400);
      expect(res.body).toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(aggregate).not.toHaveBeenCalled();
    });

    it('sin tenant resuelto no hay barrido global: TENANT_REQUIRED y no consulta', async () => {
      const res = await get(QUERY, 'SUPERADMIN', null).expect(422);
      expect(res.body).toMatchObject({
        code: 'PRECONDITION_FAILED',
        reason: 'TENANT_REQUIRED',
      });
      expect(aggregate).not.toHaveBeenCalled();
    });
  });
});
