import { jest } from '@jest/globals';
import {
  Controller,
  Global,
  Module,
  Post,
  type INestApplication,
  type NestMiddleware,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { RequirePermission } from './require-permission.decorator';
import { RequirePermissionGuard } from './require-permission.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import {
  PERMISSION_DECISION_POINT,
  PERMISSION_MODE_ENV,
  REQUIRED_PERMISSION_KEY,
  pdpActionForCode,
  resolvePermissionMode,
  type PermissionDecisionPoint,
} from './permission-decision.port';

const TENANT_A = '11111111-1111-4111-8111-111111111111';

describe('@RequirePermission', () => {
  it('rechaza al cargar un código que no es modulo.recurso.accion', () => {
    for (const bad of [
      '',
      'accounting',
      'accounting.approve',
      'Accounting.x.approve',
      'a.b.c-d',
    ]) {
      expect(() => RequirePermission(bad)).toThrow(/código inválido/);
    }
  });

  it('guarda el código y las opciones, y monta la guarda en el handler', () => {
    class Ctrl {
      @RequirePermission('accounting.journal_transactions.approve', {
        resourceIdParam: 'id',
      })
      approve(): void {}
    }
    const handler = Object.getOwnPropertyDescriptor(
      Ctrl.prototype,
      'approve',
    )!.value;
    expect(Reflect.getMetadata(REQUIRED_PERMISSION_KEY, handler)).toEqual({
      code: 'accounting.journal_transactions.approve',
      resourceIdParam: 'id',
    });
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toEqual([
      RequirePermissionGuard,
    ]);
  });
});

describe('resolvePermissionMode / pdpActionForCode', () => {
  it('prioridad: módulo > global > shadow', () => {
    const code = 'scheduling.bookings.reject';
    expect(resolvePermissionMode(code, {})).toEqual({
      mode: 'shadow',
      source: 'default',
    });
    expect(
      resolvePermissionMode(code, { [PERMISSION_MODE_ENV]: 'enforce' }),
    ).toEqual({
      mode: 'enforce',
      source: 'global-env',
    });
    expect(
      resolvePermissionMode(code, {
        [PERMISSION_MODE_ENV]: 'enforce',
        AUTHZ_PERMISSION_MODE__SCHEDULING: ' OFF ',
      }),
    ).toEqual({ mode: 'off', source: 'module-env' });
  });

  it('valor inválido del módulo cae al global y se informa', () => {
    expect(
      resolvePermissionMode('authz.x.delete', {
        AUTHZ_PERMISSION_MODE__AUTHZ: 'yes',
        [PERMISSION_MODE_ENV]: 'enforce',
      }),
    ).toEqual({ mode: 'enforce', source: 'global-env', invalid: 'yes' });
  });

  it('mapea el verbo al catálogo de acciones del PDP', () => {
    expect(pdpActionForCode('a.b.read')).toBe('READ');
    expect(pdpActionForCode('a.b.list')).toBe('READ');
    expect(pdpActionForCode('a.b.create')).toBe('CREATE');
    expect(pdpActionForCode('a.b.update')).toBe('WRITE');
    expect(pdpActionForCode('a.b.delete')).toBe('DELETE');
    expect(pdpActionForCode('a.b.approve')).toBe('APPROVE');
    expect(pdpActionForCode('a.b.reject')).toBe('APPROVE');
    expect(pdpActionForCode('a.b.export')).toBe('EXECUTE');
    expect(pdpActionForCode('a.b.configure')).toBe('EXECUTE');
  });
});

/* ------------------------------------------------------------------ */
/* Cableado real de Nest: el PDP vive en otro módulo y se encuentra.  */
/* ------------------------------------------------------------------ */

const decide = jest.fn<PermissionDecisionPoint['decide']>();

@Controller('pilot')
class PilotController {
  @Post('approve')
  @Roles('ACCOUNTING_APPROVER')
  @RequirePermission('accounting.journal_transactions.approve')
  approve(): { ok: true } {
    return { ok: true };
  }

  @Post('legacy')
  @Roles('ACCOUNTING_APPROVER')
  legacy(): { ok: true } {
    return { ok: true };
  }
}

/** El módulo del controlador NO importa al que provee el PDP. */
@Module({ controllers: [PilotController] })
class PilotModule {}

@Module({
  providers: [{ provide: PERMISSION_DECISION_POINT, useValue: { decide } }],
})
class FakeAuthzModule {}

@Global()
@Module({
  providers: [
    {
      provide: PinoLogger,
      useValue: {
        setContext: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    },
  ],
  exports: [PinoLogger],
})
class FakeLoggerModule {}

class FakeAuthMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const roles = String(req.headers['x-test-roles'] ?? '')
      .split(',')
      .filter(Boolean);
    (req as Request & { user: unknown }).user = {
      id: 'u1',
      roles,
      tenantIds: [TENANT_A],
    };
    next();
  }
}

describe('@RequirePermission por HTTP (RolesGuard global + guarda del decorador)', () => {
  let app: INestApplication;
  const saved = process.env[PERMISSION_MODE_ENV];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FakeLoggerModule, PilotModule, FakeAuthzModule],
      providers: [{ provide: APP_GUARD, useClass: RolesGuard }],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use((req: Request, res: Response, next: NextFunction) =>
      new FakeAuthMiddleware().use(req, res, next),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (saved === undefined) delete process.env[PERMISSION_MODE_ENV];
    else process.env[PERMISSION_MODE_ENV] = saved;
  });

  beforeEach(() => {
    decide.mockReset();
    process.env[PERMISSION_MODE_ENV] = 'enforce';
  });

  const post = (path: string, roles: string) =>
    request(app.getHttpServer()).post(path).set('x-test-roles', roles);

  it('enforce + PERMIT: 201 y el PDP recibe el código como recurso', async () => {
    decide.mockResolvedValue({ decision: 'PERMIT', reason: 'allow por rol' });
    await post('/pilot/approve', 'ACCOUNTING_APPROVER').expect(201);
    expect(decide).toHaveBeenCalledTimes(1);
    expect(decide.mock.calls[0][0]).toEqual({
      userId: 'u1',
      tenantId: TENANT_A,
      resource: 'accounting.journal_transactions.approve',
      action: 'APPROVE',
    });
  });

  it('enforce + DENY: 403', async () => {
    decide.mockResolvedValue({ decision: 'DENY', reason: 'x' });
    await post('/pilot/approve', 'ACCOUNTING_APPROVER').expect(403);
  });

  it('enforce + PDP que falla: 503', async () => {
    decide.mockRejectedValue(new Error('db down'));
    await post('/pilot/approve', 'ACCOUNTING_APPROVER').expect(503);
  });

  it('rol insuficiente: 403 de RolesGuard sin consultar el PDP', async () => {
    decide.mockResolvedValue({ decision: 'PERMIT', reason: 'x' });
    await post('/pilot/approve', 'ACCOUNTING').expect(403);
    expect(decide).not.toHaveBeenCalled();
  });

  it('shadow + DENY: 201 (decide @Roles)', async () => {
    process.env[PERMISSION_MODE_ENV] = 'shadow';
    decide.mockResolvedValue({ decision: 'DENY', reason: 'x' });
    await post('/pilot/approve', 'ACCOUNTING_APPROVER').expect(201);
  });

  it('ruta sin decorador: intacta, nunca consulta el PDP', async () => {
    decide.mockResolvedValue({ decision: 'DENY', reason: 'x' });
    await post('/pilot/legacy', 'ACCOUNTING_APPROVER').expect(201);
    expect(decide).not.toHaveBeenCalled();
  });
});
