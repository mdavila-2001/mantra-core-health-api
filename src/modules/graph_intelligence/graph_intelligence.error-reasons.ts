/**
 * Catálogo de sub-códigos de negocio estables para el módulo `graph_intelligence`
 * (proyección, alcance de acceso, recorrido y analítica del grafo). Se usan como
 * 3er argumento (`reason`) de `DomainException` y sus subclases, encima del
 * `code` genérico (NOT_FOUND, FORBIDDEN, etc.) que ya fija el status HTTP.
 */
export enum GraphErrorReason {
  /**
   * UUID inexistente o de otro tenant: responden exactamente igual (404), para
   * no confirmar a un tercero que el recurso existe en otra organización.
   */
  RESOURCE_OUT_OF_SCOPE = 'GRAPH_RESOURCE_OUT_OF_SCOPE',

  /**
   * Consulta con contexto de paciente sin consentimiento vigente para el
   * propósito declarado, o con una restricción de privacidad que lo niega.
   */
  CONSENT_REQUIRED = 'GRAPH_CONSENT_REQUIRED',
}
