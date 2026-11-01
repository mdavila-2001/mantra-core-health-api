import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { RequirePermissionGuard } from './require-permission.guard';
import {
  PERMISSION_CODE_PATTERN,
  REQUIRED_PERMISSION_KEY,
  type RequiredPermissionMetadata,
  type RequirePermissionOptions,
} from './permission-decision.port';

export {
  PERMISSION_CODE_PATTERN,
  REQUIRED_PERMISSION_KEY,
  type RequiredPermissionMetadata,
  type RequirePermissionOptions,
};

/**
 * Exige un permiso fino de `authz.permissions` además de `@Roles(...)`.
 *
 * Semántica (ver `RequirePermissionGuard` y `docs/.../PILOTO-REQUIRE-PERMISSION.md`):
 * - corre **después** de los guards globales (`JwtAuthGuard` → `TenantScopeGuard`
 *   → `RolesGuard` → `VerifiedIdentityGuard`), así que si `@Roles` niega, el PDP
 *   ni se consulta;
 * - `shadow` (por defecto): decide `@Roles`; el PDP se consulta en segundo
 *   plano y la discrepancia queda en el log;
 * - `enforce`: `@Roles` **y** `PERMIT` del PDP; PDP caído ⇒ 503 (fail-closed);
 * - `off`: no se consulta el PDP.
 *
 * El modo se fija por entorno: `AUTHZ_PERMISSION_MODE__<MODULO>` (primer
 * segmento del código) y, si falta, `AUTHZ_PERMISSION_MODE`. No hay modo en el
 * decorador a propósito: endurecer una ruta es una decisión de operación, no un
 * cambio de código que pueda colarse en un PR.
 *
 * Sin este decorador la ruta se comporta exactamente como antes.
 *
 * @throws Error al cargar el módulo si el código no tiene la forma
 *   `modulo.recurso.accion`: es un error de programación, no del request.
 */
export function RequirePermission(
  code: string,
  options: RequirePermissionOptions = {},
): MethodDecorator & ClassDecorator {
  if (!PERMISSION_CODE_PATTERN.test(code)) {
    throw new Error(
      `@RequirePermission: código inválido "${code}" (se espera modulo.recurso.accion en minúsculas)`,
    );
  }
  const metadata: RequiredPermissionMetadata = { code, ...options };
  return applyDecorators(
    SetMetadata(REQUIRED_PERMISSION_KEY, metadata),
    UseGuards(RequirePermissionGuard),
  );
}
