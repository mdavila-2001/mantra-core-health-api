/**
 * Códigos de error estables del dominio. Son parte del contrato de la API: el
 * cliente puede ramificar sobre `error.code` sin parsear mensajes, que están
 * pensados para humanos y pueden cambiar de redacción o idioma.
 */
export enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  /**
   * 403 por identidad sin verificar, **distinto** del 403 por rol insuficiente.
   *
   * Los dos son 403 y para la persona son estados opuestos: rol insuficiente es
   * un muro sin salida, e identidad sin verificar es una puerta —hay algo que
   * puede hacer y hay que ofrecérselo—. Sin este código el cliente sólo podía
   * separarlos comparando el texto del mensaje, que este mismo enum declara
   * inestable.
   */
  IDENTITY_VERIFICATION_REQUIRED = 'IDENTITY_VERIFICATION_REQUIRED',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  PRECONDITION_FAILED = 'PRECONDITION_FAILED',
  CONCURRENCY_CONFLICT = 'CONCURRENCY_CONFLICT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED = 'RATE_LIMITED',
  DEPENDENCY_UNAVAILABLE = 'DEPENDENCY_UNAVAILABLE',
  INTERNAL = 'INTERNAL',
}
