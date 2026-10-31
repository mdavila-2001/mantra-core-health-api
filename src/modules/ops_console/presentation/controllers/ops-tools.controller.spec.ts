import { describe, expect, it, jest, afterAll, beforeAll } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AppReadinessService } from '../../../../app-readiness.service';
import { AuthTokenModule } from '../../../../common/auth/auth-token.module';
import { JwtAuthGuard } from '../../../../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../../../common/auth/jwt.strategy';
import { ROLES_KEY } from '../../../../common/auth/roles.decorator';
import { RolesGuard } from '../../../../common/auth/roles.guard';
import { SessionValidator } from '../../../../common/auth/session-validator';
import { TokenService } from '../../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../../observability';
import { OpsToolsService } from '../../application/ops-tools.service';
import { TOOL_CATALOG } from '../../domain/tool-catalog';
import { OPS_READ_ROLES } from './ops-console.controller';
import { OpsToolsController } from './ops-tools.controller';

/**
 * `GET /admin/ops/tools` con los guards reales (JWT y roles) y el servicio
 * real; la única pieza simulada es `AppReadinessService` (sus sondas no son lo
 * que se prueba acá).
 */
describe('GET /admin/ops/tools (HTTP)', () => {
  let app: INestApplication;
  let tokens: TokenService;

  const token = (roles: string[]): string =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-000000000001',
      'sesion-1',
      roles,
    );
  const get = (roles?: string[]) => {
    const r = request(app.getHttpServer()).get('/admin/ops/tools');
    return roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [OpsToolsController],
      providers: [
        OpsToolsService,
        {
          provide: AppReadinessService,
          useValue: {
            check: jest.fn(async () => ({
              status: 'ok',
              checks: {
                postgresql: { status: 'up', latencyMs: 4 },
                mongodb: { status: 'up', latencyMs: 4 },
                redis: { status: 'up', latencyMs: 4 },
                opensearch: { status: 'up', latencyMs: 4 },
                rls: { status: 'up', latencyMs: 0 },
              },
              timestamp: new Date().toISOString(),
            })),
          },
        },
        JwtStrategy,
        // La sesión no es lo que se prueba acá: se da por activa.
        {
          provide: SessionValidator,
          useValue: { assertActive: jest.fn(async () => undefined) },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
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
      ],
    }).compile();
    app = modulo.createNestApplication({ logger: false });
    await app.init();
    tokens = modulo.get(TokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('el handler exige los roles de operación', () => {
    const proto = OpsToolsController.prototype as unknown as Record<
      string,
      object
    >;
    expect(Reflect.getMetadata(ROLES_KEY, proto.tools)).toEqual([
      ...OPS_READ_ROLES,
    ]);
  });

  it('sin token → 401', async () => {
    await get().expect(401);
  });

  it('con un rol clínico → 403 FORBIDDEN', async () => {
    const res = await get(['PATIENT', 'CLINICIAN']).expect(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it.each(OPS_READ_ROLES)(
    'el rol %s lee el catálogo completo → 200',
    async (rol) => {
      const res = await get([rol]).expect(200);
      expect(res.body.modelVersion).toBe('ops-tools/v1');
      expect(res.body.tools).toHaveLength(TOOL_CATALOG.length);
      expect(res.body.summary.total).toBe(TOOL_CATALOG.length);
      expect(res.body.summary.healthy).toBe(4);
    },
  );
});
