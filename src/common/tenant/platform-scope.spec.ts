import { jest } from '@jest/globals';
import { of, lastValueFrom } from 'rxjs';
import {
  PLATFORM_SCOPE_OPTIONAL_KEY,
  PLATFORM_SCOPE_ROLES,
  hasPlatformScope,
  isPlatformScopeRequest,
} from './platform-scope';
import { PRIVILEGED_TENANT_ROLES } from './tenant-resolution';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { getCurrentTenantId } from './tenant-context';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';

const two = ['tenant-A', 'tenant-B'];
const user = (over: Partial<AuthenticatedUser>): AuthenticatedUser => ({
  id: 'u1',
  roles: [],
  tenantIds: two,
  ...over,
});

const ROUTE_ROLES = ['PLATFORM_ADMIN', 'GOVERNANCE_ADMIN'];

describe('alcance de plataforma (H2)', () => {
  it('no amplía PRIVILEGED_TENANT_ROLES', () => {
    expect([...PRIVILEGED_TENANT_ROLES].sort()).toEqual([
      'SUPERADMIN',
      'SYSTEM',
    ]);
  });

  describe('hasPlatformScope', () => {
    it.each(PLATFORM_SCOPE_ROLES)(
      '%s global cuenta como plataforma',
      (role) => {
        expect(hasPlatformScope(user({ roles: [role] }))).toBe(true);
      },
    );

    it('un rol de plataforma sólo en scopedRoles NO cuenta', () => {
      expect(
        hasPlatformScope(
          user({
            roles: ['PLATFORM_ADMIN'],
            scopedRoles: { 'tenant-A': ['PLATFORM_ADMIN'] },
          }),
        ),
      ).toBe(false);
    });

    it.each(['BUSINESS_ADMIN', 'SECURITY_ADMIN', 'SRE', 'REPORT_VIEWER'])(
      'el rol %s no es de plataforma',
      (role) => {
        expect(hasPlatformScope(user({ roles: [role] }))).toBe(false);
      },
    );

    it('sin usuario → false', () => {
      expect(hasPlatformScope(undefined)).toBe(false);
    });
  });

  describe('isPlatformScopeRequest', () => {
    const platform = user({ roles: ['PLATFORM_ADMIN'] });
    it('ruta marcada, rol global, sin cabecera → true', () => {
      expect(
        isPlatformScopeRequest(true, { headers: {} }, platform, ROUTE_ROLES),
      ).toBe(true);
    });
    it('cabecera vacía cuenta como ausente', () => {
      expect(
        isPlatformScopeRequest(
          true,
          { headers: { 'x-tenant-id': '' } },
          platform,
          ROUTE_ROLES,
        ),
      ).toBe(true);
    });
    it('con cabecera → false (rige la membresía)', () => {
      expect(
        isPlatformScopeRequest(
          true,
          { headers: { 'x-tenant-id': 'tenant-A' } },
          platform,
          ROUTE_ROLES,
        ),
      ).toBe(false);
    });
    it('ruta sin marcar → false', () => {
      expect(
        isPlatformScopeRequest(
          undefined,
          { headers: {} },
          platform,
          ROUTE_ROLES,
        ),
      ).toBe(false);
    });
    it('rol de negocio → false', () => {
      expect(
        isPlatformScopeRequest(
          true,
          { headers: {} },
          user({ roles: ['BUSINESS_ADMIN'] }),
          ROUTE_ROLES,
        ),
      ).toBe(false);
    });
    it('rol de plataforma global que la ruta no acepta + rol de la ruta sólo acotado a un tenant → false', () => {
      const mixed = user({
        roles: ['DATA_PLATFORM_ADMIN', 'PLATFORM_ADMIN'],
        scopedRoles: { 'tenant-A': ['PLATFORM_ADMIN'] },
      } as any);
      expect(
        isPlatformScopeRequest(true, { headers: {} }, mixed, ROUTE_ROLES),
      ).toBe(false);
    });
    it('ruta sin @Roles declarados → false (cierra en falso)', () => {
      expect(
        isPlatformScopeRequest(true, { headers: {} }, platform, undefined),
      ).toBe(false);
      expect(isPlatformScopeRequest(true, { headers: {} }, platform, [])).toBe(
        false,
      );
    });
    it('SUPERADMIN conserva su propio camino → false', () => {
      expect(
        isPlatformScopeRequest(
          true,
          { headers: {} },
          user({ roles: ['SUPERADMIN'] }),
          ROUTE_ROLES,
        ),
      ).toBe(false);
    });
  });

  describe('TenantContextInterceptor en ruta marcada', () => {
    const em = { transactional: jest.fn(), execute: jest.fn() } as any;
    const build = (marked: boolean) =>
      new TenantContextInterceptor(em, {
        getAllAndOverride: (key: string) =>
          key === PLATFORM_SCOPE_OPTIONAL_KEY
            ? marked
            : key === 'requiredRoles'
              ? ROUTE_ROLES
              : false,
      } as any);
    const ctx = (
      headers: Record<string, string>,
      u: AuthenticatedUser,
    ): any => ({
      getType: () => 'http',
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          user: u,
          body: {},
          query: {},
          params: {},
        }),
      }),
    });
    const run = async (c: any, interceptor: TenantContextInterceptor) => {
      let seen: string | undefined = 'sin-ejecutar';
      await lastValueFrom(
        interceptor.intercept(c, {
          handle: () => of((seen = getCurrentTenantId())),
        }) as any,
      );
      return seen;
    };

    it('PLATFORM_ADMIN global, 2 membresías, sin cabecera → barrido sin tenant', async () => {
      expect(
        await run(ctx({}, user({ roles: ['PLATFORM_ADMIN'] })), build(true)),
      ).toBeUndefined();
    });

    it('PLATFORM_ADMIN con cabecera de tenant propio → acotado a ese tenant', async () => {
      const c = ctx(
        { 'x-tenant-id': 'tenant-B' },
        user({ roles: ['PLATFORM_ADMIN'] }),
      );
      const req = c.switchToHttp().getRequest();
      req.resolvedTenantId = 'tenant-B';
      c.switchToHttp = () => ({ getRequest: () => req });
      expect(await run(c, build(true))).toBe('tenant-B');
    });

    it('PLATFORM_ADMIN con cabecera ajena (sin guard previo) → 403', () => {
      expect(() =>
        build(true).intercept(
          ctx(
            { 'x-tenant-id': 'tenant-Z' },
            user({ roles: ['PLATFORM_ADMIN'] }),
          ),
          { handle: () => of(1) },
        ),
      ).toThrow();
    });

    it('BUSINESS_ADMIN sin cabecera y 2 membresías → sigue 403', () => {
      expect(() =>
        build(true).intercept(ctx({}, user({ roles: ['BUSINESS_ADMIN'] })), {
          handle: () => of(1),
        }),
      ).toThrow();
    });

    it('ruta sin marcar: PLATFORM_ADMIN sin cabecera y 2 membresías → 403', () => {
      expect(() =>
        build(false).intercept(ctx({}, user({ roles: ['PLATFORM_ADMIN'] })), {
          handle: () => of(1),
        }),
      ).toThrow();
    });
  });
});
