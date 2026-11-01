import { jest } from '@jest/globals';
import {
  Controller,
  Get,
  type INestApplication,
  Query,
  type NestMiddleware,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { NextFunction, Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import type { TracingService } from '../../observability';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantScopeGuard } from '../auth/tenant-scope.guard';
import { AllExceptionsFilter } from '../filters/all-exceptions.filter';
import { ParseOptionalLimitPipe } from '../http/parse-optional-limit.pipe';
import { ParseUuidListPipe } from '../http/parse-uuid-list.pipe';
import { decodeKeysetCursor } from '../pagination/keyset-cursor';
import { TenantContextInterceptor } from '../tenant/tenant-context.interceptor';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';

@Controller('core')
class CoreController {
  @Get('admin')
  @Roles('SECURITY_ADMIN')
  admin(): { ok: true } {
    return { ok: true };
  }

  @Get('echo')
  echo(@Query('tenantId') tenantId?: string): { tenantId?: string } {
    return { tenantId };
  }

  @Get('page')
  page(@Query('limit', new ParseOptionalLimitPipe(500)) limit?: number) {
    return { limit };
  }

  @Get('ids')
  ids(@Query('ids', new ParseUuidListPipe()) ids?: string[]) {
    return { ids };
  }

  @Get('cursor')
  cursor(@Query('cursor') cursor: string) {
    return decodeKeysetCursor(cursor);
  }
}

/** Autenticación de prueba: el rol y las membresías llegan por cabeceras. */
class FakeAuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const roles = String(req.headers['x-test-roles'] ?? '')
      .split(',')
      .filter(Boolean);
    const tenants = String(req.headers['x-test-tenants'] ?? '')
      .split(',')
      .filter(Boolean);
    (req as Request & { user: unknown }).user = {
      id: 'user-1',
      roles,
      tenantIds: tenants,
    };
    next();
  }
}

/**
 * El contrato de error del núcleo por HTTP, con Express, los guards reales
 * (`TenantScopeGuard`, `RolesGuard`), el interceptor de tenant real, los pipes
 * de query reales y el filtro global: lo que recibe el cliente. CAS-01,
 * CMM-01, ERR-02, CEH-01.
 */
describe('Contrato de errores del núcleo (reason estable)', () => {
  let app: INestApplication;
  const logger = { setContext: jest.fn(), warn: jest.fn(), error: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CoreController],
      providers: [
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
    app.use((req: Request, res: Response, next: NextFunction) =>
      new FakeAuthMiddleware().use(req, res, next),
    );
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

  const get = (path: string, headers: Record<string, string> = {}) => {
    const req = request(app.getHttpServer()).get(path);
    for (const [name, value] of Object.entries(headers)) req.set(name, value);
    return req;
  };

  describe('autorización y tenant (CAS-01 / CMM-01 / ERR-02)', () => {
    it('Correcto: miembro de A con X-Tenant-Id A y el rol requerido continúa', async () => {
      const res = await get('/core/admin', {
        'x-test-roles': 'SECURITY_ADMIN',
        'x-test-tenants': TENANT_A,
        'x-tenant-id': TENANT_A,
      }).expect(200);
      expect(res.body).toEqual({ ok: true });
    });

    it('rol ausente → 403 / FORBIDDEN / ROLE_INSUFFICIENT', async () => {
      const res = await get('/core/admin', {
        'x-test-roles': 'PATIENT',
        'x-test-tenants': TENANT_A,
      }).expect(403);
      expect(res.body).toMatchObject({
        code: 'FORBIDDEN',
        reason: 'ROLE_INSUFFICIENT',
        message: 'Rol insuficiente para la operación',
      });
    });

    it('cabecera de un tenant ajeno → 403 / FORBIDDEN / TENANT_MEMBERSHIP_REQUIRED', async () => {
      const res = await get('/core/echo', {
        'x-test-roles': 'PATIENT',
        'x-test-tenants': TENANT_A,
        'x-tenant-id': TENANT_B,
      }).expect(403);
      expect(res.body).toMatchObject({
        code: 'FORBIDDEN',
        reason: 'TENANT_MEMBERSHIP_REQUIRED',
      });
      expect(JSON.stringify(res.body)).not.toContain(TENANT_B);
    });

    it('varias membresías sin cabecera → TENANT_AMBIGUOUS (también en details.reason)', async () => {
      const res = await get('/core/echo', {
        'x-test-roles': 'PATIENT',
        'x-test-tenants': `${TENANT_A},${TENANT_B}`,
      }).expect(403);
      expect(res.body).toMatchObject({
        code: 'FORBIDDEN',
        reason: 'TENANT_AMBIGUOUS',
        details: { reason: 'TENANT_AMBIGUOUS' },
      });
    });

    it('sin membresías ni cabecera → TENANT_REQUIRED (rol sin espacio personal)', async () => {
      const res = await get('/core/echo', {
        'x-test-roles': 'SECURITY_ADMIN',
      }).expect(403);
      expect(res.body).toMatchObject({
        reason: 'TENANT_REQUIRED',
        details: { reason: 'TENANT_REQUIRED' },
      });
    });

    it('query con el tenant de otro → 403 / TENANT_SCOPE_CONFLICT sin el UUID ajeno ni el propio', async () => {
      const res = await get(`/core/echo?tenantId=${TENANT_B}`, {
        'x-test-roles': 'PATIENT',
        'x-test-tenants': TENANT_A,
        'x-tenant-id': TENANT_A,
      }).expect(403);
      expect(res.body).toMatchObject({
        code: 'FORBIDDEN',
        reason: 'TENANT_SCOPE_CONFLICT',
        details: { source: 'query', field: 'tenantId' },
      });
      // `path` es el eco de la URL que el propio cliente mandó; lo que no puede
      // llevar valores de tenant es el contenido del error.
      const serialized = JSON.stringify({
        message: res.body.message,
        details: res.body.details,
        reason: res.body.reason,
      });
      expect(serialized).not.toContain(TENANT_B);
      expect(serialized).not.toContain(TENANT_A);
    });

    it('SUPERADMIN con cabecera y query contradictorias → TENANT_DECLARATION_CONFLICT', async () => {
      const res = await get(`/core/echo?tenantId=${TENANT_B}`, {
        'x-test-roles': 'SUPERADMIN',
        'x-tenant-id': TENANT_A,
      }).expect(403);
      expect(res.body).toMatchObject({
        code: 'FORBIDDEN',
        reason: 'TENANT_DECLARATION_CONFLICT',
      });
      expect(res.body.message).not.toContain(TENANT_B);
    });
  });

  describe('pipes de query (CEH-01)', () => {
    const member = {
      'x-test-roles': 'PATIENT',
      'x-test-tenants': TENANT_A,
    };

    it('Correcto / límite: limit=500, limit=1, UUIDs válidos y cursor con null', async () => {
      await get('/core/page?limit=500', member).expect(200);
      await get('/core/page?limit=1', member).expect(200);
      const uuid = '9f2c4e1a-0000-4000-8000-000000000001';
      const ids = await get(`/core/ids?ids=${uuid}`, member).expect(200);
      expect(ids.body).toEqual({ ids: [uuid] });
      const cursor = Buffer.from(
        JSON.stringify({ id: 'x', at: null }),
      ).toString('base64url');
      await get(`/core/cursor?cursor=${cursor}`, member).expect(200);
    });

    it('limit=501 → 400 / VALIDATION_FAILED / INVALID_LIMIT', async () => {
      const res = await get('/core/page?limit=501', member).expect(400);
      expect(res.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        reason: 'INVALID_LIMIT',
        details: { parameter: 'limit', max: 500 },
      });
    });

    it.each(['0', 'abc', '1.5'])('limit=%s → INVALID_LIMIT', async (limit) => {
      const res = await get(`/core/page?limit=${limit}`, member).expect(400);
      expect(res.body.reason).toBe('INVALID_LIMIT');
    });

    it('ids con un elemento que no es UUID → INVALID_UUID_LIST sin repetir la entrada', async () => {
      const res = await get('/core/ids?ids=no-uuid-sensible', member).expect(
        400,
      );
      expect(res.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        reason: 'INVALID_UUID_LIST',
        details: { parameter: 'ids', invalidCount: 1 },
      });
      expect(
        JSON.stringify({
          message: res.body.message,
          details: res.body.details,
        }),
      ).not.toContain('no-uuid-sensible');
    });

    it('ids vacío y demasiado largo → INVALID_UUID_LIST', async () => {
      const empty = await get('/core/ids?ids=,', member).expect(400);
      expect(empty.body.reason).toBe('INVALID_UUID_LIST');
      const many = Array.from(
        { length: 201 },
        (_, i) => `9f2c4e1a-0000-4000-8000-${String(i).padStart(12, '0')}`,
      ).join(',');
      const tooLong = await get(`/core/ids?ids=${many}`, member).expect(400);
      expect(tooLong.body).toMatchObject({
        reason: 'INVALID_UUID_LIST',
        details: { max: 200 },
      });
    });

    it('cursor @@@ → 400 / VALIDATION_FAILED / INVALID_CURSOR, sin error de parseo crudo', async () => {
      const res = await get('/core/cursor?cursor=@@@', member).expect(400);
      expect(res.body).toMatchObject({
        code: 'VALIDATION_FAILED',
        reason: 'INVALID_CURSOR',
        message: 'El cursor de paginación no es válido',
      });
      expect(JSON.stringify(res.body)).not.toMatch(/JSON|Unexpected|position/);
    });

    it('cursor con valores no escalares → INVALID_CURSOR', async () => {
      const cursor = Buffer.from(JSON.stringify({ a: { b: 1 } })).toString(
        'base64url',
      );
      const res = await get(`/core/cursor?cursor=${cursor}`, member).expect(
        400,
      );
      expect(res.body.reason).toBe('INVALID_CURSOR');
    });
  });
});
