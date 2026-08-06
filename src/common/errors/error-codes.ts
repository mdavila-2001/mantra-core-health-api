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
  /**
   * La operación excedió su plazo y se abortó (504). **No** es sinónimo de
   * fallo: el trabajo puede haberse ejecutado del otro lado y sólo se perdió la
   * respuesta, así que un cliente que reintente debe hacerlo con la misma clave
   * de idempotencia. Separarlo de `DEPENDENCY_UNAVAILABLE` es lo que permite
   * distinguir "la dependencia dijo que no" de "la dependencia no dijo nada".
   */
  TIMEOUT = 'TIMEOUT',
  /**
   * El cortacircuitos de una dependencia está abierto: se rechaza sin intentar
   * la llamada (503). Es un rechazo **deliberado y barato** para no sumar carga
   * a algo que ya está caído; el `Retry-After` de la respuesta indica cuándo
   * volverá a probarse.
   */
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  /**
   * El mamparo (bulkhead) de concurrencia de la dependencia está lleno (503).
   * A diferencia de `RATE_LIMITED`, que cuenta peticiones por ventana de
   * tiempo, esto cuenta operaciones **en vuelo**: protege el pool de conexiones
   * y la memoria del proceso, no la cuota del cliente.
   */
  CONCURRENCY_LIMIT = 'CONCURRENCY_LIMIT',
  INTERNAL = 'INTERNAL',
}
