import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';
import { getCurrentTenantId } from './tenant-context';

/** Construye un ExecutionContext HTTP mínimo con cabeceras, sujeto y cuerpo. */
function httpContext(
  headers: Record<string, string>,
  user?: unknown,
  body: unknown = {},
): any {
  return {
    getType: () => 'http',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ headers, user, body }) }),
  };
}

/** Reflector que declara la ruta pública o privada según `isPublic`. */
function reflector(isPublic = false): any {
  return { getAllAndOverride: () => isPublic };
}

const handler = (value: unknown) => ({ handle: () => of(value) });

const em = { transactional: jest.fn(), execute: jest.fn() } as any;

/** Interceptor con el RLS de base desactivado (el default de desarrollo). */
function build(isPublic = false): TenantContextInterceptor {
  return new TenantContextInterceptor(em, reflector(isPublic));
}

describe('TenantContextInterceptor', () => {
  describe('resolución del tenant', () => {
    it('usa la cabecera X-Tenant-Id cuando el actor es miembro', async () => {
      const ctx = httpContext(
        { 'x-tenant-id': 'tenant-A' },
        { id: 'u1', roles: [], tenantIds: ['tenant-A', 'tenant-B'] },
      );
      const res = await lastValueFrom(
        build().intercept(ctx, handler('ok')) as any,
      );
      expect(res).toBe('ok');
    });

    it('deriva el tenant de la membresía única si falta la cabecera', async () => {
      const ctx = httpContext(
        {},
        { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
      );
      let seen: string | undefined;
      const spy = { handle: () => of((seen = getCurrentTenantId())) };

      await lastValueFrom(build().intercept(ctx, spy as any) as any);
      expect(seen).toBe('tenant-A');
    });

    it('rechaza si el actor tiene varias membresías y no manda cabecera', () => {
      const ctx = httpContext(
        {},
        { id: 'u1', roles: [], tenantIds: ['tenant-A', 'tenant-B'] },
      );
      expect(() => build().intercept(ctx, handler('ok'))).toThrow(
        ForbiddenException,
      );
    });

    it('rechaza si el actor no pertenece a ningún tenant', () => {
      const ctx = httpContext({}, { id: 'u1', roles: [], tenantIds: [] });
      expect(() => build().intercept(ctx, handler('ok'))).toThrow(
        ForbiddenException,
      );
    });

    it('rechaza (403) si el actor no es miembro del tenant indicado', () => {
      const ctx = httpContext(
        { 'x-tenant-id': 'tenant-B' },
        { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
      );
      expect(() => build().intercept(ctx, handler('ok'))).toThrow(
        ForbiddenException,
      );
    });

    it('SUPERADMIN pasa aunque el tenant no esté en su lista', async () => {
      const ctx = httpContext(
        { 'x-tenant-id': 'tenant-X' },
        { id: 'admin', roles: ['SUPERADMIN'], tenantIds: [] },
      );
      const res = await lastValueFrom(
        build().intercept(ctx, handler('ok')) as any,
      );
      expect(res).toBe('ok');
    });
  });

  describe('el cuerpo no puede salirse del tenant del actor', () => {
    it('rechaza un tenantId ajeno en el cuerpo', () => {
      const ctx = httpContext(
        { 'x-tenant-id': 'tenant-A' },
        { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
        { tenantId: 'tenant-B', patientProfileId: 'p1' },
      );
      expect(() => build().intercept(ctx, handler('ok'))).toThrow(
        ForbiddenException,
      );
    });

    it('rechaza un custodianTenantId ajeno en el cuerpo', () => {
      const ctx = httpContext(
        { 'x-tenant-id': 'tenant-A' },
        { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
        { custodianTenantId: 'tenant-B' },
      );
      expect(() => build().intercept(ctx, handler('ok'))).toThrow(
        ForbiddenException,
      );
    });

    it('acepta el cuerpo cuando el tenant coincide', async () => {
      const ctx = httpContext(
        { 'x-tenant-id': 'tenant-A' },
        { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
        { tenantId: 'tenant-A' },
      );
      const res = await lastValueFrom(
        build().intercept(ctx, handler('ok')) as any,
      );
      expect(res).toBe('ok');
    });

    it('no toca los tenants de contraparte (aseguradora, proveedor…)', async () => {
      const ctx = httpContext(
        { 'x-tenant-id': 'tenant-A' },
        { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
        { tenantId: 'tenant-A', insurerTenantId: 'aseguradora-Z' },
      );
      const res = await lastValueFrom(
        build().intercept(ctx, handler('ok')) as any,
      );
      expect(res).toBe('ok');
    });

    it('SUPERADMIN puede declarar cualquier tenant en el cuerpo', async () => {
      const ctx = httpContext(
        { 'x-tenant-id': 'tenant-A' },
        { id: 'admin', roles: ['SUPERADMIN'], tenantIds: [] },
        { tenantId: 'tenant-Z' },
      );
      const res = await lastValueFrom(
        build().intercept(ctx, handler('ok')) as any,
      );
      expect(res).toBe('ok');
    });
  });

  describe('rutas sin sujeto', () => {
    it('una ruta @Public() pasa sin contexto de tenant', async () => {
      const ctx = httpContext({}, undefined, {});
      const res = await lastValueFrom(
        build(true).intercept(ctx, handler('ok')) as any,
      );
      expect(res).toBe('ok');
    });

    it('los transportes no-HTTP pasan sin tocar nada', async () => {
      const ctx: any = { getType: () => 'rpc' };
      const res = await lastValueFrom(
        build().intercept(ctx, handler('ok')) as any,
      );
      expect(res).toBe('ok');
    });
  });
});
