import { roleAuthorizesInTenant } from '../../../common/auth/roles.guard';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { getCurrentTenantId } from '../../../common/tenant/tenant-context';
import { IF_MATCH_HEADER } from '../ui-visibility.constants';
import { ifMatchRequired } from '../ui-visibility.errors';
import type { UiAdminActor } from '../ui-visibility.types';

/**
 * Arma el actor administrativo desde el token y el contexto de organización del request.
 * `SUPERADMIN` de plataforma (no el acotado a un tenant) es el único con alcance total.
 */
export function toAdminActor(user: AuthenticatedUser): UiAdminActor {
  return {
    userId: user.id,
    isPlatform: roleAuthorizesInTenant(user, 'SUPERADMIN', undefined),
    tenantId: getCurrentTenantId() ?? null,
  };
}

/** `If-Match: 3`, `"3"` o `W/"3"` → 3. Cualquier otra cosa es un 400 `UI_RULE_IF_MATCH_REQUIRED`. */
export function parseIfMatch(headers: Record<string, unknown>): number {
  const raw = headers[IF_MATCH_HEADER];
  const value: unknown = Array.isArray(raw) ? (raw as unknown[])[0] : raw;
  if (typeof value !== 'string') throw ifMatchRequired();
  const m = /^\s*(?:W\/)?"?(\d{1,9})"?\s*$/.exec(value);
  if (!m) throw ifMatchRequired();
  return Number(m[1]);
}
