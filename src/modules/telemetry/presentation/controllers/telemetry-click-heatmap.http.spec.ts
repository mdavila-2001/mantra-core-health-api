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
import { TelemetryClickHeatmapService } from '../../application/services/telemetry-click-heatmap.service';
import { TelemetryClickHeatmapRepository } from '../../infrastructure/repositories/telemetry-click-heatmap.repository';
import { ANALYTICS_READ_ROLES } from './telemetry-analytics.controller';
import { TelemetryClickHeatmapController } from './telemetry-click-heatmap.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const BASE =
  '?route=/patients/:id&from=2026-10-01T00:00:00Z&to=2026-10-08T00:00:00Z';

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
 * `GET /admin/analytics/heatmap` por HTTP: controlador y servicio reales,
 * guards, interceptor de tenant, pipe de validación y filtro de errores
 * reales. Dobles declarados: el repositorio (sin Postgres) y el JWT.
 */
describe('GET /admin/analytics/heatmap (contrato HTTP, repositorio doblado)', () => {
  let app: INestApplication;
  const repo = {
    totals: mockFn(async () => ({
      clicks: 12,
      positioned: 8,
      keyboard: 3,
      repeated: 2,
    })),
    cells: mockFn(async () => [
      { col: 0, row: 0, clicks: 6 },
      { col: 19, row: 19, clicks: 2 },
    ]),
    elements: mockFn(async () => [
      { target: 'button#guardar', clicks: 7, repeated: 2, dead: 0 },
    ]),
    sizes: mockFn(async () => [{ screen_size: 'escritorio', clicks: 12 }]),
    scroll: mockFn(async () => ({
      pages: 0,
      measured: 0,
      subjects: 0,
      reached: Array(10).fill(0),
    })),
    views: mockFn(async () => 0),
  };
  const logger = { setContext: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TelemetryClickHeatmapController],
      providers: [
        TelemetryClickHeatmapService,
        { provide: TelemetryClickHeatmapRepository, useValue: repo },
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

  const reset = () => Object.values(repo).forEach((fn) => fn.mockClear());
  beforeEach(reset);

  const get = (
    query: string,
    roles?: string,
    tenant: string | null = TENANT,
  ) => {
    const req = request(app.getHttpServer()).get(
      `/admin/analytics/heatmap${query}`,
    );
    if (roles !== undefined) req.set('x-test-roles', roles);
    if (tenant) req.set('x-tenant-id', tenant);
    return req;
  };
  const notQueried = () => {
    for (const fn of Object.values(repo)) expect(fn).not.toHaveBeenCalled();
  };

  describe('Correcto', () => {
    it.each([...ANALYTICS_READ_ROLES])(
      '%s → 200 con celdas normalizadas 0–1, totales y tenant resuelto',
      async (role) => {
        const res = await get(
          `${BASE}&portal=WEB&screenSize=escritorio`,
          role,
        ).expect(200);

        expect(Object.keys(res.body).sort()).toEqual([
          'byElement',
          'byScreenSize',
          'cells',
          'grid',
          'metric',
          'notMeasured',
          'route',
          'scope',
          'scroll',
          'totals',
          'views',
          'window',
        ]);
        expect(res.body.route).toBe('/patients/:id');
        expect(res.body.grid).toEqual({ columns: 20, rows: 20 });
        expect(res.body.totals).toEqual({
          clicks: 12,
          positioned: 8,
          keyboard: 3,
          withoutPosition: 1,
          repeated: 2,
        });
        expect(res.body.cells).toEqual([
          {
            column: 0,
            row: 0,
            x: 0.025,
            y: 0.025,
            clicks: 6,
            rage: 0,
            dead: 0,
            value: 6,
            share: 0.75,
          },
          {
            column: 19,
            row: 19,
            x: 0.975,
            y: 0.975,
            clicks: 2,
            rage: 0,
            dead: 0,
            value: 2,
            share: 0.25,
          },
        ]);
        for (const cell of res.body.cells) {
          expect(cell.x).toBeGreaterThanOrEqual(0);
          expect(cell.x).toBeLessThanOrEqual(1);
          expect(cell.y).toBeGreaterThanOrEqual(0);
          expect(cell.y).toBeLessThanOrEqual(1);
        }
        expect(res.body.window).toMatchObject({
          from: '2026-10-01T00:00:00.000Z',
          to: '2026-10-08T00:00:00.000Z',
          portal: 'WEB',
          screenSize: 'escritorio',
        });
        expect(res.body.byElement).toEqual([
          { target: 'button#guardar', clicks: 7, repeated: 2, dead: 0 },
        ]);
        expect(res.body.byScreenSize).toEqual([
          { screenSize: 'escritorio', clicks: 12 },
        ]);
        expect(repo.cells.mock.calls[0][0]).toMatchObject({
          tenantId: TENANT,
          route: '/patients/:id',
          screenSize: 'escritorio',
        });
        // Sin personas: ninguna clave de sesión, sujeto o usuario en la salida.
        expect(JSON.stringify(res.body)).not.toMatch(
          /session|subject|userId|user_id/i,
        );
      },
    );

    it('limitación declarada: teclado y posición vertical siempre figuran en notMeasured', async () => {
      const res = await get(BASE, 'PLATFORM_ADMIN').expect(200);
      const metrics = res.body.notMeasured.map(
        (n: { metric: string }) => n.metric,
      );
      expect(metrics).toEqual(
        expect.arrayContaining(['keyboardClicks', 'verticalPosition']),
      );
    });
  });

  describe('Límite', () => {
    it('vacío honesto: sin clics, cells es [] y no se inventa un mapa; se declara por qué', async () => {
      repo.totals.mockImplementationOnce(async () => ({
        clicks: 0,
        positioned: 0,
        keyboard: 0,
        repeated: 0,
      }));
      repo.cells.mockImplementationOnce(async () => []);
      repo.elements.mockImplementationOnce(async () => []);
      repo.sizes.mockImplementationOnce(async () => []);
      const res = await get(BASE, 'DPO').expect(200);
      expect(res.body.cells).toEqual([]);
      expect(res.body.totals.clicks).toBe(0);
      expect(
        res.body.notMeasured.map((n: { metric: string }) => n.metric),
      ).toContain('clicks');
    });

    it('clics sin coordenadas (esquema sin propiedades): conteos sí, celdas no, y lo dice', async () => {
      repo.totals.mockImplementationOnce(async () => ({
        clicks: 5,
        positioned: 0,
        keyboard: 0,
        repeated: 0,
      }));
      repo.cells.mockImplementationOnce(async () => []);
      const res = await get(BASE, 'DPO').expect(200);
      expect(res.body.cells).toEqual([]);
      expect(res.body.totals).toMatchObject({
        clicks: 5,
        positioned: 0,
        withoutPosition: 5,
      });
      const note = res.body.notMeasured.find(
        (n: { metric: string }) => n.metric === 'coordinates',
      );
      expect(note.reason).toContain('propertySchemaJson');
    });

    it('sin from/to usa la ventana por defecto (7 días)', async () => {
      const res = await get('?route=/home', 'DPO').expect(200);
      const span =
        new Date(res.body.window.to).getTime() -
        new Date(res.body.window.from).getTime();
      expect(span).toBe(7 * 86_400_000);
    });
  });

  describe('Error', () => {
    it('sin autenticación → 401 y no consulta', async () => {
      const res = await get(BASE).expect(401);
      expect(res.body).toMatchObject({ code: 'UNAUTHENTICATED' });
      notQueried();
    });

    it.each(['PATIENT', 'PRACTITIONER'])(
      'rol %s → 403 ROLE_INSUFFICIENT y no consulta',
      async (role) => {
        const res = await get(BASE, role).expect(403);
        expect(res.body).toMatchObject({
          code: 'FORBIDDEN',
          reason: 'ROLE_INSUFFICIENT',
        });
        notQueried();
      },
    );

    it.each([
      [
        'from posterior a to',
        '?route=/home&from=2026-10-08T00:00:00Z&to=2026-10-01T00:00:00Z',
        'EMPTY_WINDOW',
      ],
      [
        'ventana > 92 días',
        '?route=/home&from=2026-01-01T00:00:00Z&to=2026-10-01T00:00:00Z',
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
        notQueried();
      },
    );

    it.each([
      ['route ausente', '?from=2026-10-01T00:00:00Z'],
      ['route vacía', '?route='],
      ['route de más de 300 caracteres', `?route=/${'a'.repeat(300)}`],
      ['from no ISO', '?route=/home&from=ayer'],
      ['tamaño fuera de catálogo', '?route=/home&screenSize=reloj'],
      ['parámetro no declarado', '?route=/home&sessionId=abc'],
    ])('%s → 400 de validación, no 500', async (_n, q) => {
      const res = await get(q, 'DPO').expect(400);
      expect(res.body).toMatchObject({ code: 'VALIDATION_FAILED' });
      notQueried();
    });

    it('X-5: SUPERADMIN sin tenant agrega entre organizaciones y, con 0 personas distintas, suprime todo (minSample 5)', async () => {
      const res = await get(BASE, 'SUPERADMIN', null).expect(200);
      expect(res.body.scope).toEqual({
        level: 'platform',
        tenantId: null,
        minSample: 5,
      });
      expect(res.body.cells).toEqual([]);
      expect(res.body.byElement).toEqual([]);
      expect(res.body.totals.clicks).toBeNull();
      expect(res.body.notMeasured[0]).toMatchObject({ metric: 'minSample' });
      expect(repo.cells.mock.calls[0][0].tenantId).toBeUndefined();
    });

    it('X-5: con suficientes personas distintas en plataforma, las celdas pequeñas se suprimen y las demás salen', async () => {
      repo.totals.mockImplementationOnce(async () => ({
        clicks: 12,
        positioned: 8,
        keyboard: 3,
        repeated: 2,
        dead: 0,
        subjects: 9,
      }));
      repo.cells.mockImplementationOnce(async () => [
        { col: 0, row: 0, clicks: 6, rage: 0, dead: 0, subjects: 6 },
        { col: 19, row: 19, clicks: 2, rage: 0, dead: 0, subjects: 2 },
      ]);
      const res = await get(BASE, 'SUPERADMIN', null).expect(200);
      expect(res.body.cells).toHaveLength(1);
      expect(res.body.cells[0]).toMatchObject({ column: 0, row: 0, clicks: 6 });
      expect(res.body.notMeasured[0].reason).toMatch(/1 celda/);
    });
  });
});
