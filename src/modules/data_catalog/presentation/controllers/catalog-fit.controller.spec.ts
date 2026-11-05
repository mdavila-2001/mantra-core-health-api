import { jest } from '@jest/globals';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
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
import { TokenService } from '../../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../../observability';
import { CatalogFitService } from '../../application/fit/catalog-fit.service';
import {
  AdminCatalogFitController,
  InternalCatalogFitController,
} from './catalog-fit.controller';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del controlador, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const CORRIDA = {
  runId: '11111111-1111-4111-8111-111111111111',
  status: 'EN_CURSO',
  trigger: 'MANUAL',
  requestedAt: '2026-10-31T12:00:00.000Z',
  finishedAt: null,
  durationMs: null,
  errorCode: null,
};

/**
 * Las rutas de la sonda de ajuste con los guards reales (JWT y roles) y el mismo `ValidationPipe`
 * que `main.ts`. El servicio es un doble: lo que se prueba acá es la frontera HTTP.
 */
describe('CatalogFitController (HTTP)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const fit = {
    latest: mockFn(() => ({ state: 'SIN_RESULTADO', report: null })),
    request: mockFn(() => ({ run: CORRIDA, created: true })),
    requestAndWait: mockFn(async () => ({
      run: { ...CORRIDA, status: 'COMPLETADA', trigger: 'TICK' },
      created: true,
      summary: { verdict: 'AJUSTADA', failedChecks: 0, blindSpots: 1 },
    })),
  };

  const token = (roles: string[]): string =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-000000000001',
      'sesion-1',
      roles,
    );
  const llamar = (
    metodo: 'get' | 'post',
    ruta: string,
    roles?: string[],
    clave?: string,
  ) => {
    let r = request(app.getHttpServer())[metodo](ruta);
    if (roles) r = r.set('Authorization', `Bearer ${token(roles)}`);
    if (clave !== undefined) r = r.set('Idempotency-Key', clave);
    return r;
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [AdminCatalogFitController, InternalCatalogFitController],
      providers: [
        JwtStrategy,
        { provide: CatalogFitService, useValue: fit },
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

  beforeEach(() => {
    fit.request.mockClear();
    fit.requestAndWait.mockClear();
  });

  describe('GET /admin/catalog/fit', () => {
    it('sin token → 401', async () => {
      await llamar('get', '/admin/catalog/fit').expect(401);
    });

    it('con un rol clínico → 403', async () => {
      await llamar('get', '/admin/catalog/fit', [
        'PATIENT',
        'CLINICIAN',
      ]).expect(403);
    });

    it.each(['AUDITOR', 'DPO', 'DATA_STEWARD', 'SECURITY_ADMIN'])(
      'el rol de lectura %s ve el último resultado',
      async (rol) => {
        const res = await llamar('get', '/admin/catalog/fit', [rol]).expect(
          200,
        );
        expect(res.body.state).toBe('SIN_RESULTADO');
      },
    );
  });

  describe('POST /admin/catalog/fit/run', () => {
    const CLAVE = 'fit-clave-0001';

    it('sin token → 401', async () => {
      await llamar('post', '/admin/catalog/fit/run', undefined, CLAVE).expect(
        401,
      );
    });

    it.each(['AUDITOR', 'DPO'])(
      'un rol que sólo lee (%s) → 403 y no pide la corrida',
      async (rol) => {
        await llamar('post', '/admin/catalog/fit/run', [rol], CLAVE).expect(
          403,
        );
        expect(fit.request).not.toHaveBeenCalled();
      },
    );

    it.each(['DATA_STEWARD', 'DATA_PLATFORM_ADMIN', 'GOVERNANCE_ADMIN'])(
      'el rol de escritura %s recibe 202 con la corrida aceptada',
      async (rol) => {
        const res = await llamar(
          'post',
          '/admin/catalog/fit/run',
          [rol],
          CLAVE,
        ).expect(202);
        expect(res.body).toEqual({
          runId: CORRIDA.runId,
          status: 'EN_CURSO',
          created: true,
          acceptedAt: CORRIDA.requestedAt,
          statusUrl: '/admin/catalog/fit',
        });
        expect(fit.request).toHaveBeenCalledWith('MANUAL', CLAVE);
      },
    );

    it('la Idempotency-Key es obligatoria y con forma válida: 422 y no corre nada', async () => {
      await llamar('post', '/admin/catalog/fit/run', ['DATA_STEWARD']).expect(
        422,
      );
      await llamar(
        'post',
        '/admin/catalog/fit/run',
        ['DATA_STEWARD'],
        'corta',
      ).expect(422);
      await llamar(
        'post',
        '/admin/catalog/fit/run',
        ['DATA_STEWARD'],
        'clave con espacios!',
      ).expect(422);
      expect(fit.request).not.toHaveBeenCalled();
    });

    it('repetir la clave devuelve 202 con created=false (no crea otra corrida)', async () => {
      fit.request.mockReturnValueOnce({ run: CORRIDA, created: false });
      const res = await llamar(
        'post',
        '/admin/catalog/fit/run',
        ['DATA_STEWARD'],
        CLAVE,
      ).expect(202);
      expect(res.body.created).toBe(false);
    });
  });

  describe('POST /internal/catalog/fit/run (worker)', () => {
    it('sin token → 401; un rol humano, aunque sea de escritura → 403', async () => {
      await llamar('post', '/internal/catalog/fit/run').expect(401);
      await llamar('post', '/internal/catalog/fit/run', [
        'DATA_PLATFORM_ADMIN',
        'GOVERNANCE_ADMIN',
      ]).expect(403);
      expect(fit.requestAndWait).not.toHaveBeenCalled();
    });

    it('con la identidad de servicio SYSTEM espera el desenlace y devuelve el resumen', async () => {
      const res = await llamar('post', '/internal/catalog/fit/run', [
        'SYSTEM',
      ]).expect(200);
      expect(res.body).toMatchObject({
        status: 'COMPLETADA',
        verdict: 'AJUSTADA',
        failedChecks: 0,
        blindSpots: 1,
        created: true,
      });
      expect(fit.requestAndWait).toHaveBeenCalledWith('TICK', null);
    });

    it('una Idempotency-Key mal formada es 422; una buena se propaga', async () => {
      await llamar('post', '/internal/catalog/fit/run', ['SYSTEM'], 'x').expect(
        422,
      );
      await llamar(
        'post',
        '/internal/catalog/fit/run',
        ['SYSTEM'],
        'fit-tick:12345678',
      ).expect(200);
      expect(fit.requestAndWait).toHaveBeenCalledWith(
        'TICK',
        'fit-tick:12345678',
      );
    });

    it('una corrida fallida se informa con su código de error, sin mensaje', async () => {
      fit.requestAndWait.mockResolvedValueOnce({
        run: { ...CORRIDA, status: 'FALLIDA', errorCode: 'RangeError' },
        created: true,
      });
      const res = await llamar('post', '/internal/catalog/fit/run', [
        'SYSTEM',
      ]).expect(200);
      expect(res.body).toMatchObject({
        status: 'FALLIDA',
        errorCode: 'RangeError',
      });
      expect(res.body.verdict).toBeUndefined();
    });
  });
});
