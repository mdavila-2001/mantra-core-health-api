import { HttpStatus } from '@nestjs/common';
import {
  DomainException,
  ErrorCode,
  PreconditionFailedException,
} from '../../../common';
import {
  WindowError,
  resolveWindow,
  type AnalyticsWindow,
  type Interval,
} from '../domain/analytics-window';
import { getCurrentTenantId } from '../../../common/tenant/tenant-context';
import { hasPlatformScope } from '../../../common/tenant/platform-scope';
import { hasPrivilegedTenantRole } from '../../../common/tenant/tenant-resolution';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';

/** Muestra mínima por defecto para agregar entre organizaciones. */
export const DEFAULT_PLATFORM_MIN_SAMPLE = 5;

/** Tope del `minSample` que una consulta puede pedir. */
export const MAX_MIN_SAMPLE = 1000;

/** Piso del servidor: `TELEMETRY_PLATFORM_MIN_SAMPLE` (entero ≥ 1, por defecto 5). */
export function platformMinSampleFloor(env = process.env): number {
  const raw = Number(env.TELEMETRY_PLATFORM_MIN_SAMPLE);
  return Number.isInteger(raw) && raw >= 1 ? raw : DEFAULT_PLATFORM_MIN_SAMPLE;
}

/**
 * Alcance de una lectura de analítica: una organización, o la plataforma entera.
 *
 * - `tenantId` definido: lo fijó el interceptor (cabecera `X-Tenant-Id` con
 *   membresía, o membresía única). Rige la organización.
 * - `tenantId` ausente: sólo ocurre en un método marcado `@PlatformScopeOptional()`
 *   para un rol de plataforma global (o `SUPERADMIN`) sin cabecera. Agrega entre
 *   organizaciones y **suprime** todo grupo con menos de `minSample` sujetos.
 *
 * `minSample` sólo existe en alcance plataforma; la consulta puede **subirlo**
 * (`?minSample=`) pero nunca bajarlo del piso del servidor.
 */
export interface AnalyticsActorScope {
  readonly tenantId?: string;
  readonly platform: boolean;
  readonly minSample?: number;
}

/**
 * Resuelve el alcance de la petición. Defensa en profundidad: aunque el
 * interceptor ya dejó el contexto sin tenant, aquí se vuelve a exigir un rol de
 * plataforma antes de agregar entre organizaciones; si no lo es, 412
 * `TENANT_REQUIRED` como antes.
 *
 * @param routeRoles - Los roles que la ruta acepta (`@Roles`).
 */
export function resolveAnalyticsScope(
  user: AuthenticatedUser | undefined,
  routeRoles: readonly string[],
  requestedMinSample?: number,
): AnalyticsActorScope {
  const tenantId = getCurrentTenantId();
  if (tenantId) return { tenantId, platform: false };
  const platform =
    user !== undefined &&
    (hasPrivilegedTenantRole(user) || hasPlatformScope(user, routeRoles));
  if (!platform) {
    throw new PreconditionFailedException(
      'La operación requiere un tenant: indique X-Tenant-Id.',
      { reason: 'TENANT_REQUIRED' },
    );
  }
  const floor = platformMinSampleFloor();
  const asked = Number.isInteger(requestedMinSample)
    ? requestedMinSample!
    : floor;
  return {
    platform: true,
    minSample: Math.min(MAX_MIN_SAMPLE, Math.max(floor, asked)),
  };
}

/** Ventana de la consulta, o 422 `VALIDATION_FAILED` con `details.reason`. */
export function windowOrThrow(input: {
  from?: string;
  to?: string;
  interval?: Interval;
}): AnalyticsWindow {
  try {
    return resolveWindow(input);
  } catch (error) {
    if (error instanceof WindowError) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        error.message,
        { reason: error.reason },
      );
    }
    throw error;
  }
}

/** La ventana inmediatamente anterior, de la misma duración. */
export function previousWindow(window: AnalyticsWindow): AnalyticsWindow {
  const span = window.to.getTime() - window.from.getTime();
  return {
    ...window,
    from: new Date(window.from.getTime() - span),
    to: new Date(window.from.getTime()),
  };
}

/** Vista JSON de la ventana. */
export function windowJson(window: AnalyticsWindow, portal?: string | null) {
  return {
    from: window.from.toISOString(),
    to: window.to.toISOString(),
    interval: window.interval,
    timezone: window.timezone,
    portal: portal ?? null,
  };
}
