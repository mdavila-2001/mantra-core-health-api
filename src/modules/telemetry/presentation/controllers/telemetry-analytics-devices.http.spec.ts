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
import { UnauthorizedException } from '../../../../common';
import { RolesGuard } from '../../../../common/auth/roles.guard';
import { TenantScopeGuard } from '../../../../common/auth/tenant-scope.guard';
import { AllExceptionsFilter } from '../../../../common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import { TenantContextInterceptor } from '../../../../common/tenant/tenant-context.interceptor';
import type { TracingService } from '../../../../observability';
import { TelemetryAnalyticsService } from '../../application/services/telemetry-analytics.service';
import { TelemetryAnalyticsRepository } from '../../infrastructure/repositories/telemetry-analytics.repository';
import { TelemetryAnalyticsController } from './telemetry-analytics.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const RAW = {
  totals: {
    contexts: 3,
    bots: 1,
    bot_unknown: 0,
    last_context_at: new Date('2026-10-07T10:00:00.000Z'),
  },
  byDeviceType: [{ code: 'MOBILE', label: 'Mobile', contexts: 3, sample: 3 }],
  byOsFamily: [{ code: 'IOS', label: 'iOS', contexts: 3, sample: 3 }],
  byBrowserFamily: [
    { code: 'SAFARI', label: 'Safari', contexts: 3, sample: 3 },
  ],
  byAppVersion: [{ code: '2.4.1', label: '2.4.1', contexts: 3, sample: 3 }],
};
const QUERY = '?from=2026-10-01T00:00:00Z&to=2026-10-08T00:00:00Z';

/**
 * Doble declarado de `JwtAuthGuard`: sin sujeto, 401 del contrato. El guard real
 * necesita la estrategia passport y un token firmado; aquí sólo importa que la
 * ruta no se sirva sin autenticación.
 */
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
 * `GET /admin/analytics/devices` por HTTP: controlador y servicio reales,
 * guards (`TenantScopeGuard`, `RolesGuard`), interceptor de tenant, pipe de
 * validación global y filtro de errores reales. Dobles declarados: el
 * repositorio (sin Postgres) y la autenticación JWT (`RequireUserGuard`).
 */
describe('GET /admin/analytics/devices (contrato HTTP, repositorio doblado)', () => {
  let app: INestApplication;
  const devices = mockFn().mockResolvedValue(RAW);
  const logger = { setContext: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TelemetryAnalyticsController],
      providers: [
        TelemetryAnalyticsService,
        { provide: TelemetryAnalyticsRepository, useValue: { devices } },
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

  beforeEach(() => devices.mockClear());

  const get = (
    query: string,
    roles?: string,
    tenant: string | null = TENANT,
  ) => {
    const req = request(app.getHttpServer()).get(
      `/admin/analytics/devices${query}`,
    );
    if (roles !== undefined) req.set('x-test-roles', roles);
    if (tenant) req.set('x-tenant-id', tenant);
    return req;
  };

  describe('Correcto', () => {
    it.each([
      'PLATFORM_ADMIN',
      'SECURITY_ADMIN',
      'DATA_PLATFORM_ADMIN',
      'MARKETING_MANAGER',
      'DPO',
    ])('%s → 200 con el contrato y el tenant resuelto', async (role) => {
      const res = await get(`${QUERY}&portal=MOBILE`, role).expect(200);

      expect(Object.keys(res.body).sort()).toEqual([
        'byAppVersion',
        'byBrowserFamily',
        'byDeviceType',
        'byOsFamily',
        'lastContextAt',
        'notMeasured',
        'scope',
        'totals',
        'window',
      ]);
      expect(res.body.totals).toEqual({ contexts: 3, bots: 1 });
      expect(res.body.window).toMatchObject({
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-08T00:00:00.000Z',
        portal: 'MOBILE',
      });
      expect(res.body.lastContextAt).toBe('2026-10-07T10:00:00.000Z');
      expect(devices.mock.calls[0][0].tenantId).toBe(TENANT);
    });

    it('sin from/to usa la ventana por defecto (7 días) y responde 200', async () => {
      await get('', 'DPO').expect(200);
      const w = devices.mock.calls[0][0].window;
      expect(w.to.getTime() - w.from.getTime()).toBe(7 * 86_400_000);
    });
  });

  describe('Error', () => {
    it('sin autenticación → 401 y no consulta', async () => {
      const res = await get(QUERY).expect(401);
      expect(res.body).toMatchObject({ code: 'UNAUTHENTICATED' });
      expect(devices).not.toHaveBeenCalled();
    });

    it.each(['PATIENT', 'PRACTITIONER'])(
      'rol %s → 403 ROLE_INSUFFICIENT y no consulta',
      async (role) => {
        const res = await get(QUERY, role).expect(403);
        expect(res.body).toMatchObject({
          code: 'FORBIDDEN',
          reason: 'ROLE_INSUFFICIENT',
        });
        expect(devices).not.toHaveBeenCalled();
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
        const res = await get(q, 'DPO').expect(422);
        expect(res.body).toMatchObject({
          code: 'VALIDATION_FAILED',
          details: { reason },
        });
        expect(devices).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['from no ISO', '?from=ayer'],
      ['portal fuera de catálogo', `${QUERY}&portal=TV`],
      [
        'parámetro no declarado (interval no existe aquí)',
        `${QUERY}&interval=hour`,
      ],
    ])('%s → 400 de validación, no 500', async (_n, q) => {
      const res = await get(q, 'DPO').expect(400);
      expect(res.body).toMatchObject({ code: 'VALIDATION_FAILED' });
      expect(devices).not.toHaveBeenCalled();
    });

    it('X-5: SUPERADMIN sin tenant agrega entre organizaciones y suprime los grupos bajo minSample (piso 5)', async () => {
      const res = await get(QUERY, 'SUPERADMIN', null).expect(200);
      expect(res.body.scope).toEqual({
        level: 'platform',
        tenantId: null,
        minSample: 5,
      });
      expect(res.body.byDeviceType).toEqual([]);
      expect(res.body.byAppVersion).toEqual([]);
      expect(res.body.notMeasured[0]).toMatchObject({ metric: 'minSample' });
      expect(devices.mock.calls[0][0].tenantId).toBeUndefined();
      expect(devices.mock.calls[0][0].minSample).toBe(5);
    });

    it('X-5: minSample de la consulta sólo sube el umbral, nunca baja del piso', async () => {
      const res = await get(`${QUERY}&minSample=1`, 'SUPERADMIN', null).expect(
        200,
      );
      expect(res.body.scope.minSample).toBe(5);
      const high = await get(
        `${QUERY}&minSample=20`,
        'SUPERADMIN',
        null,
      ).expect(200);
      expect(high.body.scope.minSample).toBe(20);
    });

    it('con X-Tenant-Id rige la organización: sin supresión y tenant en el alcance', async () => {
      const res = await get(QUERY, 'SUPERADMIN', TENANT).expect(200);
      expect(res.body.scope).toMatchObject({
        level: 'tenant',
        tenantId: TENANT,
      });
      expect(res.body.byDeviceType).toHaveLength(1);
    });
  });
});
