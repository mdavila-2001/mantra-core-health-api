import { jest } from '@jest/globals';
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RequirePermissionGuard } from './require-permission.guard';
import { RolesGuard } from './roles.guard';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';
import {
  PERMISSION_MODE_ENV,
  REQUIRED_PERMISSION_KEY,
  modulePermissionModeEnv,
  type PermissionDecisionPoint,
  type RequiredPermissionMetadata,
} from './permission-decision.port';
import type { AuthenticatedUser } from './authenticated-user.interface';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const RESOURCE_ID = '33333333-3333-4333-8333-333333333333';
const CODE = 'accounting.journal_transactions.approve';

interface Setup {
  permission?: RequiredPermissionMetadata;
  roles?: string[];
  isPublic?: boolean;
  user?: AuthenticatedUser;
  resolvedTenantId?: string;
  params?: Record<string, unknown>;
  pdp?: PermissionDecisionPoint | 'none';
  /** Lo que devuelve `moduleRef.get` cuando no se inyectó el PDP. */
  fromContainer?: PermissionDecisionPoint;
}

const ADMIN: AuthenticatedUser = {
  id: 'u-admin',
  roles: ['ACCOUNTING_APPROVER'],
  tenantIds: [TENANT_A],
};

function permitting(): { decide: any } {
  return {
    decide: fn(async () => ({ decision: 'PERMIT', reason: 'allow por rol' })),
  };
}
function denying(): { decide: any } {
  return {
    decide: fn(async () => ({
      decision: 'DENY',
      reason: 'permiso inexistente para x:APPROVE',
    })),
  };
}
function failing(): { decide: any } {
  return {
    decide: fn(async () => {
      throw new Error('connection terminated');
    }),
  };
}

function build(setup: Setup) {
  const metadata: Record<string, unknown> = {
    [REQUIRED_PERMISSION_KEY]: setup.permission,
    [ROLES_KEY]: setup.roles,
    [IS_PUBLIC_KEY]: setup.isPublic ?? false,
  };
  const reflector = {
    getAllAndOverride: fn((key: string) => metadata[key]),
  };
  const logger = {
    setContext: fn(),
    debug: fn(),
    warn: fn(),
    error: fn(),
  };
  const moduleRef = {
    get: fn(() => {
      if (!setup.fromContainer) throw new Error('not found');
      return setup.fromContainer;
    }),
  };
  const injected = setup.pdp === 'none' ? undefined : setup.pdp;
  const guard = new RequirePermissionGuard(
    reflector as never,
    logger as never,
    moduleRef as never,
    injected,
  );
  const request = {
    user: setup.user,
    resolvedTenantId: setup.resolvedTenantId,
    params: setup.params ?? {},
    method: 'POST',
    route: { path: '/accounting/journal-transactions/:id/approve' },
    originalUrl: `/accounting/journal-transactions/${RESOURCE_ID}/approve?dni=123`,
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => fn(),
    getClass: () => fn(),
  } as never;
  const rolesGuard = new RolesGuard(reflector as never);
  return { guard, logger, moduleRef, context, rolesGuard };
}

/** Deja correr la consulta en segundo plano del modo shadow. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

const ENV_KEYS = [PERMISSION_MODE_ENV, modulePermissionModeEnv('accounting')];
let savedEnv: Record<string, string | undefined>;
beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

const enforce = () => {
  process.env[PERMISSION_MODE_ENV] = 'enforce';
};

describe('RequirePermissionGuard', () => {
  describe('sin decorador / ruta pública / off', () => {
    it('sin @RequirePermission deja pasar y no consulta el PDP (aun en enforce)', async () => {
      enforce();
      const pdp = denying();
      const { guard, context } = build({ user: ADMIN, pdp });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(pdp.decide).not.toHaveBeenCalled();
    });

    it('ruta @Public deja pasar sin actor y sin PDP', async () => {
      enforce();
      const pdp = denying();
      const { guard, context } = build({
        permission: { code: CODE },
        isPublic: true,
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(pdp.decide).not.toHaveBeenCalled();
    });

    it('modo off no consulta el PDP', async () => {
      process.env[PERMISSION_MODE_ENV] = 'off';
      const pdp = denying();
      const { guard, context } = build({
        permission: { code: CODE },
        user: ADMIN,
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(pdp.decide).not.toHaveBeenCalled();
    });
  });

  describe('shadow (por defecto)', () => {
    it('sin variables de entorno el modo es shadow: un DENY del PDP no bloquea y se registra', async () => {
      const pdp = denying();
      const { guard, context, logger } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      await flush();
      expect(pdp.decide).toHaveBeenCalledTimes(1);
      const [record, message] = logger.warn.mock.calls[0];
      expect(record).toMatchObject({
        operation: 'authz.permission.check',
        outcome: 'SHADOW_WOULD_DENY',
        permission: CODE,
        mode: 'shadow',
        modeSource: 'default',
        userId: 'u-admin',
        route: '/accounting/journal-transactions/:id/approve',
      });
      expect(message).toMatch(/Discrepancia/);
      // Nunca la URL real (ids, query con datos).
      expect(JSON.stringify(record)).not.toContain('dni=123');
    });

    it('PERMIT del PDP: pasa y sólo deja un debug AGREE', async () => {
      const pdp = permitting();
      const { guard, context, logger } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      await flush();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.debug.mock.calls[0][0]).toMatchObject({ outcome: 'AGREE' });
    });

    it('PDP caído: pasa (decide @Roles) y lo registra', async () => {
      const pdp = failing();
      const { guard, context, logger } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      await flush();
      expect(logger.warn.mock.calls[0][0]).toMatchObject({
        outcome: 'SHADOW_PDP_ERROR',
        error: 'connection terminated',
      });
    });

    it('no espera al PDP: responde aunque la consulta no termine nunca', async () => {
      const pdp = { decide: fn(() => new Promise(() => undefined)) };
      const { guard, context } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('sin tenant resoluble: pasa y registra SHADOW_NOT_EVALUABLE sin preguntar', async () => {
      const pdp = permitting();
      const { guard, context, logger } = build({
        permission: { code: CODE },
        user: {
          id: 'u2',
          roles: ['ACCOUNTING_APPROVER'],
          tenantIds: [TENANT_A, TENANT_B],
        },
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      await flush();
      expect(pdp.decide).not.toHaveBeenCalled();
      expect(logger.warn.mock.calls[0][0]).toMatchObject({
        outcome: 'SHADOW_NOT_EVALUABLE',
        cause: 'TENANT_UNRESOLVED',
      });
    });
  });

  describe('enforce', () => {
    it('PERMIT: pasa', async () => {
      enforce();
      const pdp = permitting();
      const { guard, context } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(pdp.decide).toHaveBeenCalledWith(
        {
          userId: 'u-admin',
          tenantId: TENANT_A,
          resource: CODE,
          action: 'APPROVE',
        },
        ADMIN,
      );
    });

    it('DENY: 403 PERMISSION_INSUFFICIENT sin filtrar el motivo del PDP', async () => {
      enforce();
      const { guard, context, logger } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp: denying(),
      });
      const error = await guard.canActivate(context).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      const body = (error as ForbiddenException).getResponse();
      expect(body).toMatchObject({
        code: 'FORBIDDEN',
        reason: 'PERMISSION_INSUFFICIENT',
        details: { permission: CODE },
      });
      expect(JSON.stringify(body)).not.toContain('permiso inexistente');
      expect(logger.warn.mock.calls[0][0]).toMatchObject({
        outcome: 'ENFORCE_DENY',
        pdpReason: 'permiso inexistente para x:APPROVE',
      });
    });

    it('PDP caído: fail-closed con 503 AUTHZ_DECISION_UNAVAILABLE', async () => {
      enforce();
      const { guard, context, logger } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp: failing(),
      });
      const error = await guard.canActivate(context).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(
        (error as ServiceUnavailableException).getResponse(),
      ).toMatchObject({
        reason: 'AUTHZ_DECISION_UNAVAILABLE',
      });
      expect(logger.error.mock.calls[0][0]).toMatchObject({
        outcome: 'ENFORCE_PDP_UNAVAILABLE',
      });
    });

    it('PDP no registrado en el contenedor: fail-closed con 503', async () => {
      enforce();
      const { guard, context } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp: 'none',
      });
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('PDP no inyectado: lo busca en todo el contenedor (strict:false)', async () => {
      enforce();
      const fromContainer = permitting();
      const { guard, context, moduleRef } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp: 'none',
        fromContainer,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(moduleRef.get.mock.calls[0][1]).toEqual({ strict: false });
      expect(fromContainer.decide).toHaveBeenCalledTimes(1);
    });

    it('sin tenant resoluble: 403 (fail-closed) sin preguntar al PDP', async () => {
      enforce();
      const pdp = permitting();
      const { guard, context } = build({
        permission: { code: CODE },
        user: { id: 'u3', roles: ['ACCOUNTING_APPROVER'], tenantIds: [] },
        pdp,
      });
      const error = await guard.canActivate(context).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        reason: 'PERMISSION_INSUFFICIENT',
        details: { cause: 'TENANT_UNRESOLVED' },
      });
      expect(pdp.decide).not.toHaveBeenCalled();
    });

    it('sin actor: 403 (fail-closed)', async () => {
      enforce();
      const { guard, context } = build({
        permission: { code: CODE },
        pdp: permitting(),
      });
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('alcance (tenant y recurso)', () => {
    it('usa el tenant resuelto por TenantScopeGuard antes que los del token', async () => {
      enforce();
      const pdp = permitting();
      const { guard, context } = build({
        permission: { code: CODE },
        user: { ...ADMIN, tenantIds: [TENANT_A] },
        resolvedTenantId: TENANT_B,
        pdp,
      });
      await guard.canActivate(context);
      expect(pdp.decide.mock.calls[0][0].tenantId).toBe(TENANT_B);
    });

    it('sin tenant resuelto usa el único tenant del actor', async () => {
      enforce();
      const pdp = permitting();
      const { guard, context } = build({
        permission: { code: CODE },
        user: ADMIN,
        pdp,
      });
      await guard.canActivate(context);
      expect(pdp.decide.mock.calls[0][0].tenantId).toBe(TENANT_A);
    });

    it('resourceIdParam: pasa el id si es UUID (grants por recurso del PDP)', async () => {
      enforce();
      const pdp = permitting();
      const { guard, context } = build({
        permission: { code: CODE, resourceIdParam: 'id' },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        params: { id: RESOURCE_ID },
        pdp,
      });
      await guard.canActivate(context);
      expect(pdp.decide.mock.calls[0][0].resourceId).toBe(RESOURCE_ID);
    });

    it('resourceIdParam: un valor que no es UUID no se pasa', async () => {
      enforce();
      const pdp = permitting();
      const { guard, context } = build({
        permission: { code: CODE, resourceIdParam: 'id' },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        params: { id: "1' OR 1=1" },
        pdp,
      });
      await guard.canActivate(context);
      expect(pdp.decide.mock.calls[0][0]).not.toHaveProperty('resourceId');
    });

    it('pdpAction sobrescribe la acción derivada del código', async () => {
      enforce();
      const pdp = permitting();
      const { guard, context } = build({
        permission: {
          code: 'authz.users_role_assignments.delete',
          pdpAction: 'EXECUTE',
        },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp,
      });
      await guard.canActivate(context);
      expect(pdp.decide.mock.calls[0][0]).toMatchObject({
        resource: 'authz.users_role_assignments.delete',
        action: 'EXECUTE',
      });
    });
  });

  describe('SUPERADMIN', () => {
    it('SUPERADMIN de plataforma pasa sin consultar (como RolesGuard)', async () => {
      enforce();
      const pdp = denying();
      const { guard, context } = build({
        permission: { code: CODE },
        user: { id: 'root', roles: ['SUPERADMIN'] },
        pdp,
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(pdp.decide).not.toHaveBeenCalled();
    });

    it('SUPERADMIN acotado a un tenant no es comodín', async () => {
      enforce();
      const pdp = denying();
      const { guard, context } = build({
        permission: { code: CODE },
        user: {
          id: 'u4',
          roles: ['SUPERADMIN'],
          scopedRoles: { [TENANT_A]: ['SUPERADMIN'] },
        },
        resolvedTenantId: TENANT_A,
        pdp,
      });
      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('modo por módulo', () => {
    it('la variable del módulo manda sobre la global', async () => {
      process.env[PERMISSION_MODE_ENV] = 'enforce';
      process.env[modulePermissionModeEnv('accounting')] = 'shadow';
      const { guard, context } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp: denying(),
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('enforce sólo en un módulo: el resto sigue en shadow', async () => {
      process.env[modulePermissionModeEnv('accounting')] = 'enforce';
      const other = build({
        permission: { code: 'scheduling.bookings.reject' },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp: denying(),
      });
      await expect(other.guard.canActivate(other.context)).resolves.toBe(true);
      const mine = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp: denying(),
      });
      await expect(mine.guard.canActivate(mine.context)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('un valor no reconocido se ignora (shadow) y se avisa una sola vez', async () => {
      process.env[PERMISSION_MODE_ENV] = 'enforse';
      const { guard, context, logger } = build({
        permission: { code: CODE },
        user: ADMIN,
        resolvedTenantId: TENANT_A,
        pdp: permitting(),
      });
      await expect(guard.canActivate(context)).resolves.toBe(true);
      await guard.canActivate(context);
      await flush();
      const modeWarnings = logger.warn.mock.calls.filter(
        (c: any[]) => c[0].operation === 'authz.permission.mode',
      );
      expect(modeWarnings).toHaveLength(1);
      expect(modeWarnings[0][0]).toMatchObject({
        invalid: 'enforse',
        applied: 'shadow',
      });
    });
  });

  describe('interacción con @Roles (orden real: RolesGuard global → esta guarda)', () => {
    /** Corre la cadena como Nest: un guard que lanza corta la petición. */
    async function chain(setup: Setup) {
      const built = build(setup);
      built.rolesGuard.canActivate(built.context);
      return built.guard.canActivate(built.context);
    }

    it('enforce = @Roles Y permiso: rol correcto + PERMIT pasa', async () => {
      enforce();
      await expect(
        chain({
          permission: { code: CODE },
          roles: ['ACCOUNTING_APPROVER'],
          user: ADMIN,
          resolvedTenantId: TENANT_A,
          pdp: permitting(),
        }),
      ).resolves.toBe(true);
    });

    it('enforce: rol correcto + DENY ⇒ 403 de esta guarda', async () => {
      enforce();
      await expect(
        chain({
          permission: { code: CODE },
          roles: ['ACCOUNTING_APPROVER'],
          user: ADMIN,
          resolvedTenantId: TENANT_A,
          pdp: denying(),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rol insuficiente ⇒ 403 ROLE_INSUFFICIENT y el PDP ni se consulta (un PERMIT no abre)', async () => {
      enforce();
      const pdp = permitting();
      const error = await chain({
        permission: { code: CODE },
        roles: ['ACCOUNTING_APPROVER'],
        user: { id: 'u5', roles: ['ACCOUNTANT'], tenantIds: [TENANT_A] },
        resolvedTenantId: TENANT_A,
        pdp,
      }).catch((e: unknown) => e);
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        reason: 'ROLE_INSUFFICIENT',
      });
      expect(pdp.decide).not.toHaveBeenCalled();
    });

    it('shadow: el rol decide aunque el PDP diga DENY', async () => {
      await expect(
        chain({
          permission: { code: CODE },
          roles: ['ACCOUNTING_APPROVER'],
          user: ADMIN,
          resolvedTenantId: TENANT_A,
          pdp: denying(),
        }),
      ).resolves.toBe(true);
    });
  });
});
