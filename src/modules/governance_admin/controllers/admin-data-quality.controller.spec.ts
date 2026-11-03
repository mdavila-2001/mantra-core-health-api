import 'reflect-metadata';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { RolesGuard } from '../../../common/auth/roles.guard';
import { TenantScopeGuard } from '../../../common/auth/tenant-scope.guard';
import { ACCESS_LOGGED_KEY } from '../../../common/audit-trail/audit-trail.decorators';
import { AdminDataQualityController } from './admin-data-quality.controller';

/*
 * Las lecturas que muestran incidencias (cada una apunta a un recurso clínico) dejan rastro en
 * `audit.data_access_log` (regla 90.2.7). La prueba lee la METADATA del controlador REAL; el
 * interceptor que la ejecuta tiene su spec en `audit/`. Las reglas no identifican a nadie y no la
 * llevan; resolver ya lleva `@Audited`.
 */
// La prueba lee la metadata de los métodos del prototipo; nunca los invoca sueltos.
/* eslint-disable @typescript-eslint/unbound-method */
const proto = AdminDataQualityController.prototype;
const handler = (name: keyof AdminDataQualityController) =>
  proto[name] as unknown as (...args: unknown[]) => unknown;

type Meta = { resourceType: string; resourceId?: string; purpose: string };

describe('@AccessLogged en las lecturas de incidencias de calidad de datos clínicos', () => {
  it('la lista de incidencias deja rastro, sin id de recurso (no hay uno solo)', () => {
    const meta = Reflect.getMetadata(ACCESS_LOGGED_KEY, handler('issues')) as
      Meta | undefined;
    expect(meta?.resourceType).toBe('DATA_QUALITY_ISSUE');
    expect(meta?.resourceId).toBeUndefined();
    expect(meta?.purpose).toBe('DATA_GOVERNANCE');
  });

  it('una incidencia deja rastro con su id', () => {
    const meta = Reflect.getMetadata(ACCESS_LOGGED_KEY, handler('issue')) as
      Meta | undefined;
    expect(meta?.resourceType).toBe('DATA_QUALITY_ISSUE');
    expect(meta?.resourceId).toBe('param:id');
    expect(meta?.purpose).toBe('DATA_GOVERNANCE');
  });

  it.each([['rules'], ['rule']] as const)(
    '%s (definición de regla, sin personas) no lleva @AccessLogged',
    (nombre) => {
      expect(
        Reflect.getMetadata(ACCESS_LOGGED_KEY, handler(nombre)),
      ).toBeUndefined();
    },
  );
});

/*
 * Alcance (pendiente 12 del traspaso 2026-10-31): las incidencias son de TODAS las organizaciones
 * (`@TenantAgnostic`, ninguna consulta filtra por tenant). Lo que impide que un administrador
 * acotado a una organización vea las de otra es la cadena de guardas REAL: en una ruta agnóstica
 * `TenantScopeGuard` no resuelve tenant, y `RolesGuard` no deja que un rol presente en
 * `scopedRoles` autorice sin tenant resuelto, ni siquiera mandando `X-Tenant-Id`. Si alguien quita
 * `@TenantAgnostic` o relaja `roleAuthorizesInTenant`, esta prueba lo avisa.
 */
describe('calidad de datos clínicos: un rol acotado a una organización no entra', () => {
  const reflector = new Reflector();
  const tenantGuard = new TenantScopeGuard(reflector);
  const rolesGuard = new RolesGuard(reflector);

  const pasa = (
    nombre: keyof AdminDataQualityController,
    user: AuthenticatedUser,
  ): boolean => {
    const request: Record<string, unknown> = {
      user,
      headers: { 'x-tenant-id': 'org-A' },
    };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => handler(nombre),
      getClass: () => AdminDataQualityController,
    } as unknown as ExecutionContext;
    try {
      return (
        tenantGuard.canActivate(context) && rolesGuard.canActivate(context)
      );
    } catch (e) {
      if (e instanceof ForbiddenException) return false;
      throw e;
    }
  };

  it.each([['issues'], ['issue'], ['rules'], ['rule'], ['resolve']] as const)(
    '%s: SECURITY_ADMIN/DATA_STEWARD acotados a org-A → 403 aunque manden X-Tenant-Id',
    (nombre) => {
      for (const rol of ['SECURITY_ADMIN', 'DATA_STEWARD']) {
        expect(
          pasa(nombre, {
            id: 'u-acotado',
            roles: [rol],
            tenantIds: ['org-A'],
            scopedRoles: { 'org-A': [rol] },
          } as AuthenticatedUser),
        ).toBe(false);
      }
    },
  );

  it('el mismo rol asignado sin organización (global) sí lee', () => {
    expect(
      pasa('issues', {
        id: 'u-global',
        roles: ['SECURITY_ADMIN'],
        tenantIds: ['org-A'],
      } as AuthenticatedUser),
    ).toBe(true);
  });
});
