import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import type { Response } from 'express';
import {
  catchError,
  from,
  map,
  mergeMap,
  of,
  throwError,
  type Observable,
} from 'rxjs';
import type { AuthenticatedRequest } from '../auth/authenticated-user.interface';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';
import { IdempotencyStore, type IdempotencyRecord } from './idempotency.store';
import { IDEMPOTENCY_HEADER, IDEMPOTENT_KEY } from './idempotent.decorator';

/** Cuánto se recuerda una respuesta: la ventana de reintento de un cliente. */
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Cuánto dura la reserva mientras la operación corre. Holgado frente al plazo
 * de cualquier escritura, y corto frente a las 24 h: si la réplica muere a
 * mitad, la clave se libera sola en minutos.
 */
export const IDEMPOTENCY_LOCK_TTL_MS = 2 * 60 * 1000;

/** Cabecera que avisa al cliente que la respuesta es una repetición. */
export const IDEMPOTENT_REPLAYED_HEADER = 'Idempotent-Replayed';

/** Caracteres visibles ASCII, 1-255: cabe un UUID y no cabe basura. */
const KEY_PATTERN = /^[\x21-\x7E]{1,255}$/;

/**
 * Idempotencia real por `Idempotency-Key` en las escrituras marcadas con
 * `@Idempotent()`.
 *
 * ## Qué hace
 *
 * 1. Sin cabecera, o en un manejador sin `@Idempotent()`, no interviene.
 * 2. Con cabecera, acota la clave a **tenant + usuario + método + ruta**: la
 *    misma clave en otro recurso, de otro usuario o en otro tenant es otra
 *    operación, y nunca puede devolverle a alguien la respuesta de otro.
 * 3. Reserva la clave de forma atómica y ejecuta. Si sale bien, guarda status
 *    y cuerpo 24 h; si falla, suelta la reserva para que el reintento ejecute.
 * 4. Un reintento con la misma clave y la misma huella recibe la respuesta
 *    guardada, con el mismo status y `Idempotent-Replayed: true`, sin tocar el
 *    manejador.
 *
 * ## Por qué los errores no se guardan
 *
 * Sólo se recuerdan las respuestas exitosas. Un 4xx de validación es
 * determinista —repetirlo da lo mismo—, y un 409/422 de negocio o un 5xx
 * pueden dejar de serlo (el horario se liberó, la dependencia volvió): fijarlos
 * 24 h obligaría al cliente a cambiar de clave para un reintento legítimo, que
 * es justo lo que la clave existe para evitar.
 *
 * ## Dónde corre
 *
 * Se registra como interceptor global **antes** de `TenantContextInterceptor`,
 * así envuelve la transacción RLS: la respuesta se guarda cuando la
 * transacción ya confirmó, y un rollback nunca queda registrado como éxito.
 * Los guards (autenticación, roles, acceso a la historia) corren antes que
 * cualquier interceptor, así que una repetición tampoco saltea la
 * autorización.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param reflector - Lee la marca `@Idempotent()` del manejador.
   * @param store - Almacén de claves (Redis con respaldo en memoria).
   */
  constructor(
    private readonly reflector: Reflector,
    private readonly store: IdempotencyStore,
  ) {}

  /**
   * Aplica la idempotencia al manejador marcado.
   *
   * @param context - Contexto de ejecución de Nest.
   * @param next - Continuación de la cadena.
   * @returns La respuesta original o su repetición.
   * @throws DomainException 400 si la clave es inválida, 422 si se reutiliza con
   *         otro cuerpo y 409 si la misma clave sigue en curso.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const marcado = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!marcado) return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest<AuthenticatedRequest>();
    const res = http.getResponse<Response>();

    const crudo = req.headers[IDEMPOTENCY_HEADER];
    if (crudo === undefined) return next.handle();

    const clave = Array.isArray(crudo) ? crudo[0] : crudo;
    if (typeof clave !== 'string' || !KEY_PATTERN.test(clave)) {
      throw new DomainException(
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_FAILED,
        'La cabecera Idempotency-Key debe tener entre 1 y 255 caracteres visibles.',
      );
    }

    const ruta = (req.originalUrl ?? req.url).split('?')[0];
    const alcance = this.alcance(req, ruta, clave);
    const huella = this.huella(req.query, req.body);

    return from(
      this.store.acquire(alcance, huella, IDEMPOTENCY_LOCK_TTL_MS),
    ).pipe(
      mergeMap((reserva) => {
        if (!reserva.acquired) {
          return of(this.repetir(reserva.existing, huella, res));
        }
        return next.handle().pipe(
          mergeMap((body: unknown) => {
            const status = res.statusCode;
            const serializado = this.serializable(body);
            return from(
              this.store.complete(
                alcance,
                {
                  state: 'COMPLETED',
                  fingerprint: huella,
                  status,
                  body: serializado,
                },
                IDEMPOTENCY_TTL_MS,
              ),
            ).pipe(map(() => body));
          }),
          catchError((err: unknown) =>
            from(this.store.release(alcance)).pipe(
              mergeMap(() => throwError(() => err)),
            ),
          ),
        );
      }),
    );
  }

  /**
   * Resuelve un pedido cuya clave ya estaba ocupada.
   *
   * @returns El cuerpo guardado, si es una repetición legítima.
   * @throws DomainException 422 o 409 según el caso.
   */
  private repetir(
    existente: IdempotencyRecord,
    huella: string,
    res: Response,
  ): unknown {
    // La huella se compara antes que el estado: reciclar la clave con otro
    // cuerpo es un error del cliente aunque la primera siga en curso, y
    // decirle "reintentá" lo llevaría a repetir el error.
    if (existente.fingerprint !== huella) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.IDEMPOTENCY_KEY_REUSED,
        'Esta Idempotency-Key ya se usó con otros datos. Genere una clave nueva para este envío.',
      );
    }

    if (existente.state !== 'COMPLETED') {
      res.setHeader('Retry-After', '1');
      throw new DomainException(
        HttpStatus.CONFLICT,
        ErrorCode.IDEMPOTENCY_REQUEST_IN_PROGRESS,
        'Una petición con esta Idempotency-Key todavía está en curso. Reintente con la misma clave.',
      );
    }

    if (existente.status !== undefined) res.status(existente.status);
    res.setHeader(IDEMPOTENT_REPLAYED_HEADER, 'true');
    return existente.body;
  }

  /**
   * Clave de almacenamiento: tenant, usuario, método, ruta y clave del cliente,
   * hasheados para que ningún dato del pedido viaje en claro a Redis.
   */
  private alcance(
    req: AuthenticatedRequest,
    ruta: string,
    clave: string,
  ): string {
    const tenantCabecera = req.headers['x-tenant-id'];
    const tenant =
      req.resolvedTenantId ??
      (typeof tenantCabecera === 'string' ? tenantCabecera : '-');
    const usuario = req.user?.id ?? 'anon';
    return createHash('sha256')
      .update([tenant, usuario, req.method, ruta, clave].join('\n'))
      .digest('hex');
  }

  /** Huella del contenido del pedido: query y cuerpo en forma canónica. */
  private huella(query: unknown, body: unknown): string {
    return createHash('sha256')
      .update(canonicalJson({ query: query ?? {}, body: body ?? null }))
      .digest('hex');
  }

  /**
   * Copia JSON del cuerpo: es lo mismo que Express enviará, y deja fuera
   * instancias, fechas como objeto y referencias que no sobreviven a Redis.
   */
  private serializable(body: unknown): unknown {
    if (body === undefined) return undefined;
    return JSON.parse(JSON.stringify(body)) as unknown;
  }
}

/**
 * JSON con las claves de cada objeto ordenadas: `{a, b}` y `{b, a}` son el
 * mismo envío y tienen que dar la misma huella.
 *
 * @param value - Valor a serializar.
 * @returns Su representación canónica.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_clave, valor: unknown) => {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      return Object.fromEntries(
        Object.entries(valor as Record<string, unknown>).sort(([a], [b]) =>
          a < b ? -1 : a > b ? 1 : 0,
        ),
      );
    }
    return valor;
  });
}
