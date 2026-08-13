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
   * Roles efectivos que exige `RolesGuard`. Al emitir el token se componen de
   * los globales de plataforma (`iam.user_global_roles`: `USER`, `PATIENT`,
   * `SECURITY_ADMIN`, `SUPERADMIN`) y de los de negocio vigentes en
   * `authz.user_role_assignments` (los diez actores clínicos, entre otros).
   */
  readonly roles: string[];
  /**
   * Tenants de los que el sujeto es miembro activo (de `directory.tenant_memberships`
   * al emitir el token). El `TenantContextGuard` exige que el `X-Tenant-Id` del
   * request pertenezca a esta lista (salvo `SUPERADMIN`).
   */
  readonly tenantIds?: string[];
  /**
   * Perfil profesional del sujeto (`profiles.health_practitioner_profiles`),
   * cuando la cuenta es de un profesional sanitario. Viaja en el claim `hpid`.
   *
   * Lo necesitan los actos que una persona ejecuta **sobre sí misma** —aceptar
   * su participación en un equipo quirúrgico, por ejemplo—: sin él, un rol
   * clínico bastaba para actuar en nombre de cualquier otro integrante.
   */
  readonly practitionerProfileId?: string;
}

/** Request de Express después de que `JwtAuthGuard` adjunta el sujeto validado. */
export type AuthenticatedRequest = Omit<Request, 'user'> & {
  readonly user?: AuthenticatedUser;
};
import type { Request } from 'express';
