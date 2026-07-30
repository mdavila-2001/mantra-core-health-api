import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';

/** Construye un ExecutionContext HTTP mínimo con las cabeceras y el user dados. */
function httpContext(headers: Record<string, string>, user?: unknown): any {
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ headers, user }) }),
  };
}

/**
 * Ejecuta la operación handler.
 *
 * @param value - Valor de value requerido por la operación.
 * @returns Resultado de handler.
 */
const handler = (value: unknown) => ({ handle: () => of(value) });

describe('TenantContextInterceptor', () => {
  const em = { transactional: jest.fn(), execute: jest.fn() } as any;

  it('sin cabecera X-Tenant-Id deja pasar el request tal cual', async () => {
    const interceptor = new TenantContextInterceptor(em);
    const res = await lastValueFrom(
      interceptor.intercept(
        httpContext({}, { id: 'u1', roles: [] }),
        handler('ok'),
      ) as any,
    );
    expect(res).toBe('ok');
  });

  it('rechaza (403) si el actor no es miembro del tenant indicado', () => {
    const interceptor = new TenantContextInterceptor(em);
    const ctx = httpContext(
      { 'x-tenant-id': 'tenant-B' },
      { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
    );
    expect(() => interceptor.intercept(ctx, handler('ok'))).toThrow(
      ForbiddenException,
    );
  });

  it('deja pasar si el actor es miembro del tenant', async () => {
    const interceptor = new TenantContextInterceptor(em);
    const ctx = httpContext(
      { 'x-tenant-id': 'tenant-A' },
      { id: 'u1', roles: [], tenantIds: ['tenant-A'] },
    );
    const res = await lastValueFrom(
      interceptor.intercept(ctx, handler('ok')) as any,
    );
    expect(res).toBe('ok');
  });

  it('SUPERADMIN pasa aunque el tenant no esté en su lista', async () => {
    const interceptor = new TenantContextInterceptor(em);
    const ctx = httpContext(
      { 'x-tenant-id': 'tenant-X' },
      { id: 'admin', roles: ['SUPERADMIN'], tenantIds: [] },
    );
    const res = await lastValueFrom(
      interceptor.intercept(ctx, handler('ok')) as any,
    );
    expect(res).toBe('ok');
  });
});
