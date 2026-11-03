/**
 * Sub-códigos de negocio estables para los errores de dominio de `vector_rag`.
 * Van como `reason` de `DomainException` (y subclases), encima del `code`
 * genérico (NOT_FOUND, etc.) que ya fija el status HTTP.
 *
 * Ambos se lanzan igual para un UUID inexistente que para uno de otro tenant:
 * distinguirlos le confirmaría a un tercero que el recurso existe en otra
 * organización.
 */
export enum VectorErrorReason {
  /** Colección, job, política, sesión o chunk fuera del alcance de la petición. */
  RESOURCE_OUT_OF_SCOPE = 'VECTOR_RESOURCE_OUT_OF_SCOPE',
  /** Borrado cuya referencia no resuelve a nada del tenant. */
  DELETION_TARGET_OUT_OF_SCOPE = 'VECTOR_DELETION_TARGET_OUT_OF_SCOPE',
}
