import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

/** Metadata que marca un manejador como idempotente por `Idempotency-Key`. */
export const IDEMPOTENT_KEY = 'mch:idempotent';

/** Nombre de la cabecera, en minúsculas como la entrega Express. */
export const IDEMPOTENCY_HEADER = 'idempotency-key';

/**
 * Marca una escritura como idempotente por la cabecera `Idempotency-Key`.
 *
 * Con la cabecera, `IdempotencyInterceptor` recuerda la respuesta durante 24 h
 * y la devuelve tal cual a cada reintento con la misma clave, sin volver a
 * ejecutar el manejador. Sin la cabecera, el comportamiento es el de siempre:
 * es opcional para no romper a ningún cliente existente.
 *
 * Errores que agrega al contrato:
 * - 422 `IDEMPOTENCY_KEY_REUSED`: la clave ya se usó con otro cuerpo.
 * - 409 `IDEMPOTENCY_REQUEST_IN_PROGRESS`: la misma clave sigue en curso;
 *   reintentar con la misma clave.
 */
export const Idempotent = (): MethodDecorator & ClassDecorator =>
  applyDecorators(
    SetMetadata(IDEMPOTENT_KEY, true),
    ApiHeader({
      name: 'Idempotency-Key',
      required: false,
      description:
        'Clave única por intento de envío (1-255 caracteres visibles). Un reintento con la misma clave y el mismo cuerpo recibe la respuesta original sin re-ejecutar; con otro cuerpo, 422 IDEMPOTENCY_KEY_REUSED; mientras la primera sigue en curso, 409 IDEMPOTENCY_REQUEST_IN_PROGRESS.',
    }),
  );
