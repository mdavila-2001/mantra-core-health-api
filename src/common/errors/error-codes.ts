/**
 * Códigos de error estables del dominio. Son parte del contrato de la API: el
 * cliente puede ramificar sobre `error.code` sin parsear mensajes, que están
 * pensados para humanos y pueden cambiar de redacción o idioma.
 */
export enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  PRECONDITION_FAILED = 'PRECONDITION_FAILED',
  CONCURRENCY_CONFLICT = 'CONCURRENCY_CONFLICT',
  INTERNAL = 'INTERNAL',
}
