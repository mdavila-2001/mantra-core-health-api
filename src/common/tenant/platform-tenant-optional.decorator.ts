import { SetMetadata } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.interface';
import { roleAuthorizesInTenant } from '../auth/roles.guard';

/** Opt-in de rutas con autorización propia de alcance plataforma. */
export const PLATFORM_TENANT_OPTIONAL_KEY = 'platformTenantOptionalRoles';

/** No amplía privilegios generales ni elimina el contexto de actores ordinarios. */
export const PlatformTenantOptional = (
  ...roles: string[]
): ClassDecorator & MethodDecorator =>
  SetMetadata(PLATFORM_TENANT_OPTIONAL_KEY, roles);

export function hasOptionalPlatformTenant(
  user: AuthenticatedUser,
  roles: unknown,
): boolean {
  return (
    Array.isArray(roles) &&
    roles.some(
      (role: unknown) =>
        typeof role === 'string' &&
        roleAuthorizesInTenant(user, role, undefined),
    )
  );
}
