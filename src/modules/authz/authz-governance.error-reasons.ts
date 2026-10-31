/**
 * Motivos estables de los rechazos de la extensión del gobierno de acceso: permisos por alcance de
 * recurso. El cliente ramifica por estos valores (`reason` en la raíz del cuerpo de error), nunca
 * por el texto del mensaje. Los del resto del gobierno (usuario o permiso inexistente, revisión de
 * la propia cuenta) viven en `AuthzErrorReason`.
 */
export enum AuthzGovernanceErrorReason {
  /** No existe el permiso por alcance de recurso (también si es de otro tenant). */
  RESOURCE_SCOPE_GRANT_NOT_FOUND = 'RESOURCE_SCOPE_GRANT_NOT_FOUND',
  /** El permiso por alcance de recurso ya terminó su vigencia. */
  RESOURCE_SCOPE_GRANT_ALREADY_ENDED = 'RESOURCE_SCOPE_GRANT_ALREADY_ENDED',
  /** Terminar un permiso de efecto DENY exige un motivo (levantar una denegación abre un acceso). */
  RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED = 'RESOURCE_SCOPE_GRANT_DENY_REASON_REQUIRED',
}
