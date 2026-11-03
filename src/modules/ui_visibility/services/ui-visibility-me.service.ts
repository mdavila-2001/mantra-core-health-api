import { Injectable } from '@nestjs/common';
import { roleAuthorizesInTenant } from '../../../common/auth/roles.guard';
import type { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { hasPrivilegedTenantRole } from '../../../common/tenant/tenant-resolution';
import {
  hiddenKeysOf,
  visibilityVersion,
} from '../resolver/ui-visibility.resolver';
import { UiVisibilityStore } from '../repositories/ui-visibility.store';
import type { MyUiVisibilityView } from '../ui-visibility.types';
import { resolveForSubject } from './ui-visibility-resolution';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Organización con la que se resuelve la visibilidad de quien llama, o `null` si no hay una.
 *
 * Es presentación, no autorización: no rechaza, degrada. Una cabecera `X-Tenant-Id` sólo vale si
 * la organización es una de las membresías del token (o el actor es de plataforma); una ajena o
 * mal formada se ignora, de modo que nadie puede pedir la resolución «como si» fuera de otra
 * organización. Sin cabecera, vale la única membresía si es una sola.
 */
export function pickVisibilityTenant(
  header: string | undefined,
  user: AuthenticatedUser,
): string | null {
  const memberships = user.tenantIds ?? [];
  if (header) {
    const candidate = header.trim();
    if (!UUID_RE.test(candidate)) return null;
    return memberships.includes(candidate) || hasPrivilegedTenantRole(user)
      ? candidate
      : null;
  }
  return memberships.length === 1 ? memberships[0] : null;
}

/**
 * `GET /me/ui-visibility`: la resolución de la propia persona, y de nadie más. Devuelve sólo lo
 * oculto (lo demás es visible). La visibilidad no autoriza: la API sigue decidiendo cada petición.
 */
@Injectable()
export class UiVisibilityMeService {
  constructor(private readonly store: UiVisibilityStore) {}

  async resolveMine(
    user: AuthenticatedUser,
    tenantId: string | null,
    now: Date = new Date(),
  ): Promise<MyUiVisibilityView> {
    // Roles que el usuario ejerce EN esta organización: uno concedido sólo en otra no cuenta.
    const roles = [
      ...new Set(
        (user.roles ?? []).filter((role) =>
          roleAuthorizesInTenant(user, role, tenantId ?? undefined),
        ),
      ),
    ].sort();
    const orgType = tenantId
      ? await this.store.orgTypeOfTenant(tenantId)
      : null;
    const entries = await resolveForSubject(
      this.store,
      { userId: user.id, tenantId, roles, orgType },
      now,
    );
    const hiddenKeys = hiddenKeysOf(entries);
    return {
      hiddenKeys,
      version: visibilityVersion(hiddenKeys),
      generatedAt: now.toISOString(),
    };
  }
}
