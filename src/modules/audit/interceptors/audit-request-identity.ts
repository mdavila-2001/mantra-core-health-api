import type { ExecutionContext } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { isUuid, joinRouteTemplate } from '../../../common/audit-trail';
import { getCurrentTenantId } from '../../../common/tenant/tenant-context';
import type { AuthenticatedRequest } from '../../../common/auth/authenticated-user.interface';

/** Plantilla de la ruta tal como la declaran `@Controller()` y el verbo. */
export function routeTemplate(context: ExecutionContext): string {
  const first = (value: unknown): string =>
    Array.isArray(value)
      ? first(value[0])
      : typeof value === 'string'
        ? value
        : '';
  return joinRouteTemplate(
    first(Reflect.getMetadata(PATH_METADATA, context.getClass())),
    first(Reflect.getMetadata(PATH_METADATA, context.getHandler())),
  );
}

/** Tenant del sello: el del contexto de la petición (no el custodio, §8.3). */
export function tenantOf(
  request: Pick<AuthenticatedRequest, 'resolvedTenantId'>,
): string | undefined {
  const tenantId = getCurrentTenantId() ?? request.resolvedTenantId;
  return isUuid(tenantId) ? tenantId : undefined;
}
