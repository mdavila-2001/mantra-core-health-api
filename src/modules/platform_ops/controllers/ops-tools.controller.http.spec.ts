import { jest } from '@jest/globals';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import request from 'supertest';
import { AuthTokenModule } from '../../../common/auth/auth-token.module';
import { JwtAuthGuard } from '../../../common/auth/jwt-auth.guard';
import { JwtStrategy } from '../../../common/auth/jwt.strategy';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { SessionValidator } from '../../../common/auth/session-validator';
import { TokenService } from '../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../observability';
import { ResourceNotFoundException } from '../../../common';
import { PlatformOpsErrorReason } from '../platform_ops.error-reasons';
import { OPS_READ_ROLES } from '../../ops_console/presentation/controllers/ops-console.controller';
import { OpsToolsService } from '../services/ops-tools.service';
import { OpsToolsController } from './ops-tools.controller';

/**
 * Contrato HTTP de `/admin/ops/tools` con los guards reales (JWT y roles).
 * DOBLE DECLARADO: `OpsToolsService` es un fake; la lógica de estado se prueba
 * en `ops-tools.service.spec.ts` y las consultas contra la base quedan sin
 * verificar en esta suite.
 */
describe('OpsToolsController (HTTP)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const service = {
    list: jest.fn(async () => ({
      evaluatedAt: '2026-10-31T12:00:00.000Z',
      items: [],
      notMeasured: [],
    })),
    get: jest.fn(async (code: string) => {
      if (code !== 'redis') {
        throw new ResourceNotFoundException(
          'Herramienta no encontrada',
          { code },
          PlatformOpsErrorReason.TOOL_NOT_FOUND,
        );
      }
      return { code, history: [] };
    }),
  };

  const token = (roles: string[]): string =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-000000000001',
      'sesion-1',
      roles,
    );
  const get = (ruta: string, roles?: string[]) => {
    const r = request(app.getHttpServer()).get(ruta);
    return roles ? r.set('Authorization', `Bearer ${token(roles)}`) : r;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [OpsToolsController],
      providers: [
        JwtStrategy,
        { provide: OpsToolsService, useValue: service },
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
    app = modulo.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    tokens = modulo.get(TokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  const RUTAS = ['/admin/ops/tools', '/admin/ops/tools/redis'];

  it('todos los handlers exigen los roles de operación', () => {
    const proto = OpsToolsController.prototype as unknown as Record<
      string,
      object
    >;
    const handlers = Object.getOwnPropertyNames(proto).filter(
      (n) => n !== 'constructor',
    );
    expect(handlers).toHaveLength(2);
    for (const handler of handlers) {
      expect(Reflect.getMetadata(ROLES_KEY, proto[handler])).toEqual([
        ...OPS_READ_ROLES,
      ]);
    }
  });

  it.each(RUTAS)('%s sin token → 401', async (ruta) => {
    await get(ruta).expect(401);
  });

  it.each(RUTAS)('%s con un rol clínico → 403', async (ruta) => {
    const res = await get(ruta, ['PATIENT', 'CLINICIAN']).expect(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it.each(OPS_READ_ROLES)('el rol %s puede leer la lista', async (rol) => {
    const res = await get('/admin/ops/tools', [rol]).expect(200);
    expect(res.body).toEqual({
      evaluatedAt: '2026-10-31T12:00:00.000Z',
      items: [],
      notMeasured: [],
    });
  });

  it('detalle existente → 200', async () => {
    await get('/admin/ops/tools/redis', ['SRE']).expect(200);
  });

  it('detalle inexistente → 404 del contrato con reason', async () => {
    const res = await get('/admin/ops/tools/no-existe', ['SRE']).expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.reason).toBe(PlatformOpsErrorReason.TOOL_NOT_FOUND);
  });
});
