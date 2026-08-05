/**
 * Identidad del sujeto autenticado tal como la reconstruye el backend a partir
 * del JWT validado. Es el contrato que reciben controladores y servicios vía
 * `@CurrentUser()`; deliberadamente no expone secretos ni el token en crudo.
 */
export interface AuthenticatedUser {
  /** `iam.users.id` del sujeto. */
  readonly id: string;
  /** Identificador de sesión (`iam.sessions.token_id`) que respalda el token. */
  readonly sessionId?: string;
  /**
   * Roles globales efectivos (códigos de concepto, p. ej. `SUPERADMIN`). Se
   * usan por `RolesGuard`; su fuente es `iam.user_global_roles` al emitir el token.
   */
  readonly roles: string[];
  /**
   * Tenants de los que el sujeto es miembro activo (de `directory.tenant_memberships`
   * al emitir el token). El `TenantContextGuard` exige que el `X-Tenant-Id` del
   * request pertenezca a esta lista (salvo `SUPERADMIN`).
   */
  readonly tenantIds?: string[];
}

/** Request de Express después de que `JwtAuthGuard` adjunta el sujeto validado. */
export type AuthenticatedRequest = Omit<Request, 'user'> & {
  readonly user?: AuthenticatedUser;
};
import type { Request } from 'express';
