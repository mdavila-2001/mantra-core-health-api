import { HttpStatus } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';

/**
 * Errores del dominio de audio.
 *
 * La regla que gobierna este archivo: **la falta de audio nunca es una
 * excepción**. Un presupuesto agotado, un proveedor caído o un fallback sin
 * pre-generar se resuelven devolviendo `UNAVAILABLE`, porque el onboarding tiene
 * que continuar sin audio en vez de romperse. Solo se lanza cuando el problema
 * es atribuible a quien llama —plantilla inexistente, solicitud inválida— o
 * cuando el estado en base es imposible.
 */

/** Códigos estables del dominio. Viajan en logs, métricas y respuestas. */
export const AUDIO_ERROR = {
  templateNotFound: 'AUDIO_TEMPLATE_NOT_FOUND',
  requestInvalid: 'AUDIO_REQUEST_INVALID',
  prewarmDynamic: 'AUDIO_PREWARM_DYNAMIC_TEMPLATE',
  tenantRequired: 'AUDIO_TENANT_REQUIRED',
  variableMissing: 'AUDIO_TEMPLATE_VARIABLE_MISSING',
  variableInvalid: 'AUDIO_TEMPLATE_VARIABLE_INVALID',
  tooManyVariables: 'AUDIO_TEMPLATE_TOO_MANY_VARIABLES',
  textTooLong: 'AUDIO_TEXT_TOO_LONG',
  cipherFormat: 'AUDIO_CIPHER_FORMAT_INVALID',
  cipherKeyUnknown: 'AUDIO_CIPHER_KEY_UNKNOWN',
  cipherAuthFailed: 'AUDIO_CIPHER_AUTH_FAILED',
  cipherKeyTooShort: 'AUDIO_CIPHER_KEY_TOO_SHORT',
  cipherKeyringInvalid: 'AUDIO_CIPHER_KEYRING_INVALID',
  storageUriInvalid: 'AUDIO_STORAGE_URI_INVALID',
  storagePathEscape: 'AUDIO_STORAGE_PATH_ESCAPE',
  storageEmptyBody: 'AUDIO_STORAGE_EMPTY_BODY',
  assetNotFound: 'AUDIO_ASSET_NOT_FOUND',
  infrastructure: 'AUDIO_GENERATION_INFRASTRUCTURE_FAILURE',
  maxAttempts: 'AUDIO_MAX_ATTEMPTS_REACHED',
  budgetExhaustedAtGeneration: 'AUDIO_BUDGET_EXHAUSTED_AT_GENERATION',
} as const;

/**
 * Fallo atribuible al llamador o al estado del dominio.
 *
 * Extiende `DomainException` (y por tanto `HttpException`) para que el
 * `AllExceptionsFilter` lo publique con el mismo contrato de error que el resto
 * de los 57 módulos en vez de un 500 opaco. `audioCode` conserva además el
 * código fino del dominio, que es lo que se correlaciona en los logs.
 */
export class AudioDomainError extends DomainException {
  constructor(
    message: string,
    readonly audioCode: string,
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
    errorCode: ErrorCode = ErrorCode.VALIDATION_FAILED,
  ) {
    super(status, errorCode, message, { audioCode });
    this.name = 'AudioDomainError';
  }
}

/** Plantilla ausente o desactivada: 404, no 422. */
export class AudioTemplateNotFoundError extends AudioDomainError {
  constructor(code: string) {
    super(
      `Plantilla de audio no encontrada o inactiva: ${code}`,
      AUDIO_ERROR.templateNotFound,
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND,
    );
  }
}

/**
 * Fallo del proveedor de síntesis.
 *
 * `retryable` no es un detalle de registro: decide si el asset vuelve a la cola
 * (`FAILED_RETRYABLE`) o se cierra para siempre (`FAILED_PERMANENT`) liberando
 * su reserva de presupuesto. Un 401 del proveedor reintentado 4 veces no arregla
 * la credencial y sí consume los intentos del asset.
 */
export class TtsProviderError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = 'TtsProviderError';
  }
}

/** Códigos que emite la capa de resiliencia del worker, no el proveedor. */
export const AUDIO_RESILIENCE_ERROR = {
  circuitOpen: 'AUDIO_PROVIDER_CIRCUIT_OPEN',
  bulkheadFull: 'AUDIO_PROVIDER_BULKHEAD_FULL',
  bulkheadTimeout: 'AUDIO_PROVIDER_BULKHEAD_TIMEOUT',
} as const;

/**
 * Clasifica un error desconocido como transitorio.
 *
 * El sesgo es deliberado: un error que nadie clasificó se trata como pasajero y
 * se reintenta, porque el techo de intentos del asset acaba cerrándolo de todas
 * formas. Al revés —dar por permanente lo que no se reconoce— un `ECONNRESET`
 * durante un despliegue quemaría el asset para siempre.
 */
export function isRetryableAudioError(error: unknown): boolean {
  if (error instanceof TtsProviderError) return error.retryable;
  if (error instanceof AudioDomainError) return false;
  return true;
}

/** Código estable de un error, para logs y para `last_error_code`. */
export function audioErrorCodeOf(error: unknown): string {
  if (error instanceof TtsProviderError) return error.code;
  if (error instanceof AudioDomainError) return error.audioCode;
  return AUDIO_ERROR.infrastructure;
}
