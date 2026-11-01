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
import { SessionValidator } from '../../../common/auth/session-validator';
import { TenantScopeGuard } from '../../../common/auth/tenant-scope.guard';
import { TokenService } from '../../../common/auth/token.service';
import { AllExceptionsFilter } from '../../../common/filters/all-exceptions.filter';
import { TracingService } from '../../../observability';
import { DataQualityService } from '../services/data-quality.service';
import { AdminDataQualityController } from './admin-data-quality.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** La organización del administrador acotado y otra ajena, dueña de las incidencias. */
const ORG_PROPIA = '00000000-0000-4000-8000-0000000000b1';
const ORG_AJENA = '00000000-0000-4000-8000-0000000000a1';
const ISSUE_AJENA = '22222222-2222-4222-8222-222222222222';

/**
 * Pendiente 12 (a): un `SECURITY_ADMIN` **acotado a una organización** (`scopedRoles`, MCH-001) no
 * ve incidencias de calidad de datos clínicos de otra. La ruta es de plataforma (`@TenantAgnostic`):
 * no se resuelve tenant, y un rol con ámbito sólo autoriza dentro de un tenant resuelto, así que la
 * respuesta es 403 antes de llegar al servicio (fail-closed), elija la organización que elija en
 * `X-Tenant-Id`. El servicio es un doble que DEVOLVERÍA incidencias ajenas: si una prueba llegara
 * a él, la fuga se vería.
 *
 * Guards reales y en el orden de `AuthModule`: JWT → alcance de tenant → roles.
 */
describe('Calidad de datos clínicos · alcance por organización (HTTP)', () => {
  let app: INestApplication;
  let tokens: TokenService;
  const ajena = {
    id: ISSUE_AJENA,
    tenantId: ORG_AJENA,
    ruleCode: 'R-1',
    status: 'OPEN',
  };
  const service = {
    listIssues: mockFn(async () => ({
      items: [ajena],
      nextCursor: null,
      limit: 25,
      total: 1,
    })),
    getIssue: mockFn(async () => ajena),
    resolve: mockFn(async () => ({ issue: ajena, alreadyApplied: false })),
    listRules: mockFn(async () => ({
      items: [],
      nextCursor: null,
      limit: 25,
      total: 0,
    })),
    getRule: mockFn(async () => ({ id: 'r' })),
  };

  const tokenAcotado = (roles: string[]): string =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-0000000000c1',
      'sesion-acotada',
      roles,
      [ORG_PROPIA],
      { scopedRoles: { [ORG_PROPIA]: roles } },
    );
  const tokenPlataforma = (): string =>
    tokens.signAccessToken(
      '00000000-0000-4000-8000-0000000000d1',
      'sesion-plataforma',
      ['SECURITY_ADMIN'],
    );

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [PassportModule, AuthTokenModule],
      controllers: [AdminDataQualityController],
      providers: [
        JwtStrategy,
        { provide: DataQualityService, useValue: service },
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
            info: jest.fn(),
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
    Object.values(service).forEach((f: any) => f.mockClear());
  });

  const rutas: { metodo: 'get' | 'post'; ruta: string; body?: object }[] = [
    { metodo: 'get', ruta: '/admin/governance/data-quality/issues' },
    {
      metodo: 'get',
      ruta: `/admin/governance/data-quality/issues/${ISSUE_AJENA}`,
    },
    {
      metodo: 'post',
      ruta: `/admin/governance/data-quality/issues/${ISSUE_AJENA}/resolution`,
      body: { action: 'RESOLVE', note: 'Se corrigió el dato en origen' },
    },
    { metodo: 'get', ruta: '/admin/governance/data-quality/rules' },
  ];

  describe.each([
    ['su propia organización', ORG_PROPIA],
    ['la organización ajena', ORG_AJENA],
    ['ninguna', undefined],
  ])('SECURITY_ADMIN acotado, con X-Tenant-Id de %s', (_n, tenant) => {
    it.each(rutas)(
      '$metodo $ruta → 403 sin tocar el servicio',
      async ({ metodo, ruta, body }) => {
        // Con DATA_STEWARD también acotado: ni siquiera el rol que resuelve abre la ruta fuera de un tenant.
        let r = request(app.getHttpServer())
          [metodo](ruta)
          .set(
            'Authorization',
            `Bearer ${tokenAcotado(['SECURITY_ADMIN', 'DATA_STEWARD'])}`,
          );
        if (tenant) r = r.set('X-Tenant-Id', tenant);
        if (body) r = r.send(body);
        const res = await r;
        expect(res.status).toBe(403);
        // Nada del recurso ajeno en el cuerpo (la ruta sí viaja en `path`).
        expect(res.body).toMatchObject({ code: 'FORBIDDEN' });
        expect(res.body).not.toHaveProperty('items');
        expect(JSON.stringify(res.body)).not.toContain(ORG_AJENA);
        for (const f of Object.values(service))
          expect(f).not.toHaveBeenCalled();
      },
    );
  });

  it('control: el SECURITY_ADMIN de plataforma (sin ámbito) sí lee las incidencias', async () => {
    const res = await request(app.getHttpServer())
      .get('/admin/governance/data-quality/issues')
      .set('Authorization', `Bearer ${tokenPlataforma()}`);
    expect(res.status).toBe(200);
    expect(service.listIssues).toHaveBeenCalledTimes(1);
  });
});
