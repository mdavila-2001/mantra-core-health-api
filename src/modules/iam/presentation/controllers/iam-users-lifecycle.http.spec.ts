import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import type { PinoLogger } from 'nestjs-pino';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import request from 'supertest';
import { JwtAuthGuard } from '../../../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../../../common/auth/roles.guard';
import { TenantScopeGuard } from '../../../../common/auth/tenant-scope.guard';
import { AllExceptionsFilter } from '../../../../common/filters/all-exceptions.filter';
import { createGlobalValidationPipe } from '../../../../common/http/validation-pipe';
import type { TracingService } from '../../../../observability';
import {
  IamAssistedRegistrationService,
  IamCredentialsService,
  IamDevicesService,
  IamMfaService,
  IamPractitionerSelfRegistrationService,
  IamUsersReadService,
  IamUsersService,
} from '../../application/services';
import { IamUsersController } from './iam-users.controller';

/**
 * Ciclo de vida de la cuenta por HTTP con la cadena REAL de autenticación y autorización
 * (`JwtAuthGuard` + `TenantScopeGuard` + `RolesGuard`), el pipe de validación global y el filtro de
 * errores. Doblado, y así se declara: `IamUsersService` (la transición contra PostgreSQL real está
 * BLOQUEADA en esta máquina; la cubre `iam-users-lifecycle.service.spec.ts` con repositorios dobles).
 */
const SECRET = 'test-secret-only-for-this-spec';
const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const TARGET = '5d8f3c2a-1b4e-4c6d-8e9f-0a1b2c3d4e5f';
const REASON = 'Cese de funciones';

type Who = {
  sub: string;
  roles: string[];
  tenantIds: string[];
  scopedRoles?: Record<string, string[]>;
};
const bearer = (who: Who) => `Bearer ${jwt.sign(who, SECRET)}`;

const ADMIN: Who = {
  sub: 'admin-1',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [TENANT_A],
};
const ADMIN_SOLO_TENANT_A: Who = {
  sub: 'admin-a',
  roles: ['SECURITY_ADMIN'],
  tenantIds: [TENANT_A, TENANT_B],
  scopedRoles: { [TENANT_A]: ['SECURITY_ADMIN'] },
};
const PACIENTE: Who = {
  sub: 'pac-1',
  roles: ['PATIENT'],
  tenantIds: [TENANT_A],
};
const CLINICO: Who = {
  sub: 'clin-1',
  roles: ['CLINICIAN'],
  tenantIds: [TENANT_A],
};
const SUPERADMIN: Who = { sub: 'root-1', roles: ['SUPERADMIN'], tenantIds: [] };

const RESULT = {
  id: TARGET,
  state: 'SUSPENDED',
  changed: true,
  revokedSessions: 2,
};

describe('HTTP del ciclo de vida de la cuenta (H5)', () => {
  let app: INestApplication;
  const mockFn = (impl?: any): any => (jest.fn as any)(impl);
  const users = {
    suspend: mockFn(async () => RESULT),
    reactivate: mockFn(async () => ({ ...RESULT, state: 'ACTIVE' })),
    deactivate: mockFn(async () => ({ ...RESULT, state: 'DEACTIVATED' })),
    lifecycleOf: mockFn(async () => ({
      userId: TARGET,
      state: 'SUSPENDED',
      items: [],
      nextCursor: null,
      limit: 20,
    })),
  };

  const api = (
    method: 'get' | 'post',
    path: string,
    who?: Who,
    tenant: string | null = TENANT_A,
  ) => {
    let r = request(app.getHttpServer())[method](path);
    if (who) r = r.set('Authorization', bearer(who));
    if (tenant) r = r.set('X-Tenant-Id', tenant);
    return r;
  };

  beforeAll(async () => {
    passport.use(
      'jwt',
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: SECRET,
        },
        (p: Who, done: (e: unknown, u?: unknown) => void) =>
          done(null, {
            id: p.sub,
            roles: p.roles,
            tenantIds: p.tenantIds,
            scopedRoles: p.scopedRoles,
          }),
      ),
    );
    const stub = {};
    const module = await Test.createTestingModule({
      controllers: [IamUsersController],
      providers: [
        { provide: IamUsersService, useValue: users },
        { provide: IamUsersReadService, useValue: stub },
        { provide: IamCredentialsService, useValue: stub },
        { provide: IamMfaService, useValue: stub },
        { provide: IamDevicesService, useValue: stub },
        { provide: IamAssistedRegistrationService, useValue: stub },
        { provide: IamPractitionerSelfRegistrationService, useValue: stub },
      ],
    }).compile();
    app = module.createNestApplication({ logger: false });
    const reflector = app.get(Reflector);
    app.useGlobalGuards(
      new JwtAuthGuard(reflector),
      new TenantScopeGuard(reflector),
      new RolesGuard(reflector),
    );
    app.useGlobalPipes(createGlobalValidationPipe());
    app.useGlobalFilters(
      new AllExceptionsFilter(
        {
          setContext: () => undefined,
          error: () => undefined,
          warn: () => undefined,
          info: () => undefined,
        } as unknown as PinoLogger,
        {
          setAttribute: () => undefined,
          recordException: () => undefined,
          addEvent: () => undefined,
        } as unknown as TracingService,
      ),
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    for (const fn of Object.values(users)) fn.mockClear();
  });

  const ACTIONS = [
    ['suspend', 'suspend'],
    ['reactivate', 'reactivate'],
    ['deactivate', 'deactivate'],
  ] as const;

  describe.each(ACTIONS)('POST /iam/users/:id/%s', (path, method) => {
    const url = `/iam/users/${TARGET}/${path}`;

    describe('autorización negativa', () => {
      it('sin token: 401 y no llega al servicio', async () => {
        await api('post', url).send({ reason: REASON }).expect(401);
        expect(users[method]).not.toHaveBeenCalled();
      });

      it.each([
        ['paciente', PACIENTE],
        ['clínico', CLINICO],
      ])('rol insuficiente (%s): 403 ROLE_INSUFFICIENT', async (_n, who) => {
        const res = await api('post', url, who)
          .send({ reason: REASON })
          .expect(403);
        expect(res.body).toMatchObject({ reason: 'ROLE_INSUFFICIENT' });
        expect(users[method]).not.toHaveBeenCalled();
      });

      it('administrador de OTRA organización (rol acotado al tenant A, pide el B): 403', async () => {
        const res = await api('post', url, ADMIN_SOLO_TENANT_A, TENANT_B)
          .send({ reason: REASON })
          .expect(403);
        expect(res.body).toMatchObject({ reason: 'ROLE_INSUFFICIENT' });
        expect(users[method]).not.toHaveBeenCalled();
      });

      it('tenant del que no es miembro: 403 TENANT_MEMBERSHIP_REQUIRED', async () => {
        const res = await api('post', url, ADMIN, TENANT_B)
          .send({ reason: REASON })
          .expect(403);
        expect(res.body).toMatchObject({
          reason: 'TENANT_MEMBERSHIP_REQUIRED',
        });
        expect(users[method]).not.toHaveBeenCalled();
      });
    });

    describe('validación', () => {
      it.each([
        ['sin cuerpo', {}],
        ['motivo vacío', { reason: '' }],
        ['motivo sólo espacios', { reason: '    ' }],
        ['motivo que no es texto', { reason: 7 }],
        ['motivo de 501 caracteres', { reason: 'x'.repeat(501) }],
        ['clave que el contrato no declara', { reason: REASON, notify: true }],
      ])('%s: 400 y no llega al servicio', async (_n, body) => {
        const res = await api('post', url, ADMIN).send(body).expect(400);
        expect(res.body).toMatchObject({ code: 'VALIDATION_FAILED' });
        expect(users[method]).not.toHaveBeenCalled();
      });

      it('id que no es uuid: 400', async () => {
        await api('post', `/iam/users/no-uuid/${path}`, ADMIN)
          .send({ reason: REASON })
          .expect(400);
        expect(users[method]).not.toHaveBeenCalled();
      });
    });

    describe('correcto y límite', () => {
      it('SECURITY_ADMIN: 200 con el resultado; el servicio recibe id, motivo recortado y actor', async () => {
        const res = await api('post', url, ADMIN)
          .send({ reason: `  ${REASON}  ` })
          .expect(200);
        expect(res.body).toMatchObject({ id: TARGET, changed: true });
        expect(users[method]).toHaveBeenCalledWith(
          TARGET,
          REASON,
          expect.objectContaining({ id: 'admin-1' }),
        );
      });

      it('motivo de exactamente 500 caracteres se acepta', async () => {
        await api('post', url, ADMIN)
          .send({ reason: 'x'.repeat(500) })
          .expect(200);
      });

      it('SUPERADMIN pasa por el comodín del guard', async () => {
        await api('post', url, SUPERADMIN, null)
          .send({ reason: REASON })
          .expect(200);
        expect(users[method]).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('GET /iam/users/:id/lifecycle', () => {
    const url = `/iam/users/${TARGET}/lifecycle`;

    it('sin token 401; paciente 403; otra organización 403', async () => {
      await api('get', url).expect(401);
      await api('get', url, PACIENTE).expect(403);
      await api('get', url, ADMIN_SOLO_TENANT_A, TENANT_B).expect(403);
      expect(users.lifecycleOf).not.toHaveBeenCalled();
    });

    it.each([0, 101, 'diez', 2.5])('limit %p: 400', async (limit) => {
      await api('get', `${url}?limit=${limit}`, ADMIN).expect(400);
      expect(users.lifecycleOf).not.toHaveBeenCalled();
    });

    it('SECURITY_ADMIN: 200 y delega el cursor y el tope', async () => {
      const res = await api('get', `${url}?limit=100&cursor=abc`, ADMIN).expect(
        200,
      );
      expect(res.body).toMatchObject({ userId: TARGET, state: 'SUSPENDED' });
      expect(users.lifecycleOf).toHaveBeenCalledWith(
        TARGET,
        expect.objectContaining({ limit: 100, cursor: 'abc' }),
      );
    });
  });
});
