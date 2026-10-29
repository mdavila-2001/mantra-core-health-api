import type { AuthenticatedUser } from '../../../common';

/**
 * Puertos de las decisiones de acceso a un contrato de vista.
 *
 * El autorizador (`ViewContractAuthorizer`) sólo conoce estas cuatro preguntas;
 * quién las responde (authz, terminología, banderas, clínica) se decide en el
 * módulo. Son clases abstractas para servir de token de inyección y para que las
 * pruebas del autorizador no necesiten base de datos.
 */

/** ¿Tiene el usuario este permiso, en el tenant activo? (deny-overrides). */
export abstract class ViewPermissionGate {
  /**
   * @param user - Quien pide la vista.
   * @param tenantId - Tenant activo (las asignaciones con otro tenant no cuentan).
   * @param permissionId - `authz.permissions.id` exigido por la ruta, el campo o la acción.
   * @returns `true` sólo si hay un `ALLOW` vigente y ningún `DENY`.
   */
  abstract holds(
    user: AuthenticatedUser,
    tenantId: string | undefined,
    permissionId: string,
  ): Promise<boolean>;
}

/** ¿Pertenece el usuario a la audiencia (conjunto de roles) de un portal? */
export abstract class ViewAudienceGate {
  /**
   * @param user - Quien pide la vista.
   * @param valueSetId - `terminology.value_sets.id` con los roles de la audiencia.
   * @returns `true` si alguno de los roles del usuario está en el conjunto.
   */
  abstract isInAudience(
    user: AuthenticatedUser,
    valueSetId: string,
  ): Promise<boolean>;
}

/** ¿Está encendido este feature flag? */
export abstract class ViewFeatureFlags {
  /**
   * @param code - `frontend_routes.feature_flag_code`.
   * @param tenantId - Tenant activo, si lo hay.
   * @returns `true` sólo si el flag está encendido para ese tenant.
   */
  abstract isEnabled(
    code: string,
    tenantId: string | undefined,
  ): Promise<boolean>;
}

/** ¿Puede el usuario ver los datos de este paciente? */
export abstract class ViewPatientAccess {
  /**
   * @param user - Quien pide la vista.
   * @param patientProfileId - Paciente cuyo contexto declara la petición.
   * @returns `true` si hay base para tratar a ese paciente.
   */
  abstract canAccess(
    user: AuthenticatedUser,
    patientProfileId: string,
  ): Promise<boolean>;
}
