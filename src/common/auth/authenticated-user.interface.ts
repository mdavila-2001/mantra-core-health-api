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
   * Códigos de rol de negocio con ámbito de tenant, indexados por el tenant en
   * el que fueron concedidos (MCH-001). Un código presente aquí sólo autoriza
   * dentro del tenant que lo indexa; si un código de `roles` no aparece en
   * ningún tenant de este mapa, es una excepción global documentada (rol de
   * plataforma o asignación sin tenant declarado) y sigue autorizando en
   * cualquiera, como siempre.
   */
  readonly scopedRoles?: Record<string, string[]>;
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
  /**
   * Perfil de paciente del sujeto (`profiles.patient_profiles`), cuando la
   * cuenta tiene uno. Viaja en el claim `pid`, que ya se firmaba pero no se
   * reconstruía acá — así que ningún servicio podía saber de qué paciente era
   * la sesión sin que el cliente se lo dijera.
   *
   * Lo necesitan las lecturas del autoservicio que **deben** acotarse al
   * titular: los cuestionarios de un paciente son suyos, y resolver de quién
   * son a partir de un parámetro del cliente deja que cualquiera pida los de
   * otro. Con esto, el servidor lo decide solo.
   *
   * **No es una credencial ni participa de ninguna decisión de rol**, igual que
   * `practitionerProfileId`: es identificación, no permiso.
   */
  readonly patientProfileId?: string;
}

/** Request de Express después de que `JwtAuthGuard` adjunta el sujeto validado. */
export type AuthenticatedRequest = Omit<Request, 'user'> & {
  readonly user?: AuthenticatedUser;
  /**
   * Tenant activo del request, resuelto por `TenantScopeGuard` antes de que
   * `RolesGuard` autorice (MCH-001). `undefined` en un barrido de sistema.
   */
  resolvedTenantId?: string;
};
import type { Request } from 'express';
