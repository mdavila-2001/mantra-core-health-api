import { SetMetadata } from '@nestjs/common';

/** Clave de metadata con los roles globales exigidos por un handler. */
export const ROLES_KEY = 'requiredRoles';

/**
 * Exige que el sujeto posea al menos uno de los roles globales indicados
 * (códigos de concepto, p. ej. `SECURITY_ADMIN`). La verificación la aplica
 * `RolesGuard`; sin este decorador, basta con estar autenticado.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
