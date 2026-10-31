/**
 * Sub-códigos de negocio estables para los errores de dominio de `terminology`.
 * Van como `reason` de `DomainException` (y subclases), encima del `code`
 * genérico (NOT_FOUND, etc.) que ya fija el status HTTP.
 *
 * `TENANT_NOT_AVAILABLE` se lanza igual para un tenant inexistente que para uno
 * ajeno al contexto de la petición: distinguirlos confirmaría a un tercero que
 * ese tenant existe.
 */
export enum TerminologyErrorReason {
  TENANT_NOT_AVAILABLE = 'TERMINOLOGY_TENANT_NOT_AVAILABLE',

  /** El término del glosario no existe (editor administrativo). */
  GLOSSARY_TERM_NOT_FOUND = 'GLOSSARY_TERM_NOT_FOUND',

  /** Ya existe un término con ese slug y contenido distinto (alta no idempotente). */
  GLOSSARY_TERM_ALREADY_EXISTS = 'GLOSSARY_TERM_ALREADY_EXISTS',

  /** `expectedRowVersion` no coincide con la versión actual del término (409). */
  GLOSSARY_TERM_VERSION_MISMATCH = 'GLOSSARY_TERM_VERSION_MISMATCH',

  /** El glosario aún no tiene su conjunto «todos los términos» sembrado. */
  GLOSSARY_UMBRELLA_MISSING = 'GLOSSARY_UMBRELLA_MISSING',
}
