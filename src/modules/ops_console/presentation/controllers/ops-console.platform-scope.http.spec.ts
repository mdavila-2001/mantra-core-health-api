import { jest } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AuthTokenModule } from '../../../../common/auth/auth-token.module';
import { JwtAuthGuard } from '../../../../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../../../common/auth/jwt.strategy';
import { RolesGuard } from '../../../../common/auth/roles.guard';
import { SessionValidator } from '../../../../common/auth/session-validator';
import { TenantScopeGuard } from '../../../../common/auth/tenant-scope.guard';
import { TokenService } from '../../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../../common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import { TracingService } from '../../../../observability';
import { OpsConsoleService } from '../../application/ops-console.service';
import { OpsTrafficService } from '../../application/ops-traffic.service';
import { OpsConsoleController } from './ops-console.controller';

/**
 * Alcance de plataforma en `/admin/ops/*` con la cadena real de guards
 * (`JwtAuthGuard → TenantScopeGuard → RolesGuard`) y tokens firmados por
 * `TokenService`. El `TenantContextInterceptor` (RLS) no entra: necesita
 * base de datos y se cubre en `platform-scope.spec.ts`.
 */
describe('/admin/ops: alcance de plataforma sin X-Tenant-Id (HTTP)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const Z = '99999999-9999-4999-8999-999999999999';
  const traffic = jest.fn(async () => ({ requests: 0 }));

  const get = (
    roles?: string[],
    opts: {
      tenants?: string[];
      header?: string;
      scoped?: Record<string, string[]>;
    } = {},
  ) => {
    const r = request(app.getHttpServer()).get('/admin/ops/traffic');
    if (!roles) return r;
    const token = tokens.signAccessToken(
      '00000000-0000-4000-8000-000000000001',
      'sesion-1',
      roles,
      opts.tenants ?? [A, B],
      { scopedRoles: opts.scoped },
    );
    r.set('Authorization', `Bearer ${token}`);
    return opts.header ? r.set('X-Tenant-Id', opts.header) : r;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [OpsConsoleController],
      providers: [
        JwtStrategy,
        {
          provide: SessionValidator,
          useValue: { assertActive: jest.fn(async () => undefined) },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: TenantScopeGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_FILTER, useClass: AllExceptionsFilter },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: TracingService,
          useValue: {
            setAttribute: jest.fn(),
            recordException: jest.fn(),
            addEvent: jest.fn(),
          },
        },
        { provide: OpsConsoleService, useValue: {} },
        { provide: OpsTrafficService, useValue: { traffic } },
      ],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(createGlobalValidationPipe());
    await app.init();
    tokens = moduleRef.get(TokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => traffic.mockClear());

  it('PLATFORM_ADMIN global con 2 membresías, sin cabecera → 200', async () => {
    await get(['PLATFORM_ADMIN']).expect(200);
    expect(traffic).toHaveBeenCalledTimes(1);
  });

  it('PLATFORM_ADMIN con cabecera de tenant propio → 200', async () => {
    await get(['PLATFORM_ADMIN'], { header: B }).expect(200);
  });

  it('PLATFORM_ADMIN con cabecera de tenant ajeno → 403 TENANT_MEMBERSHIP_REQUIRED', async () => {
    const res = await get(['PLATFORM_ADMIN'], { header: Z }).expect(403);
    expect(res.body.reason).toBe('TENANT_MEMBERSHIP_REQUIRED');
    expect(traffic).not.toHaveBeenCalled();
  });

  it('BUSINESS_ADMIN con 2 membresías, sin cabecera → 403 TENANT_AMBIGUOUS', async () => {
    const res = await get(['BUSINESS_ADMIN']).expect(403);
    expect(res.body.reason).toBe('TENANT_AMBIGUOUS');
  });

  it('PLATFORM_ADMIN sólo con ámbito de tenant → 403 TENANT_AMBIGUOUS', async () => {
    const res = await get(['PLATFORM_ADMIN'], {
      scoped: { [A]: ['PLATFORM_ADMIN'] },
    }).expect(403);
    expect(res.body.reason).toBe('TENANT_AMBIGUOUS');
  });

  it('sin token → 401', async () => {
    await get().expect(401);
  });

  it('rol insuficiente (REPORT_VIEWER) → 403 ROLE_INSUFFICIENT', async () => {
    const res = await get(['REPORT_VIEWER'], { tenants: [A] }).expect(403);
    expect(res.body.reason).toBe('ROLE_INSUFFICIENT');
  });

  it.each(['DATA_PLATFORM_ADMIN'])(
    '%s global no está en OPS_READ_ROLES: pasa el alcance pero la ruta manda → 403 ROLE_INSUFFICIENT',
    async (role) => {
      const res = await get([role]).expect(403);
      expect(res.body.reason).toBe('ROLE_INSUFFICIENT');
      expect(traffic).not.toHaveBeenCalled();
    },
  );

  it('GOVERNANCE_ADMIN global (en OPS_READ_ROLES) sin cabecera → 200', async () => {
    await get(['GOVERNANCE_ADMIN']).expect(200);
  });

  it('SUPERADMIN sin cabecera → 200', async () => {
    await get(['SUPERADMIN']).expect(200);
  });
});
