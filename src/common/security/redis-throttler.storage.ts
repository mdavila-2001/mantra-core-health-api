import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../modules/redis_runtime/redis.provider';

/** Prefijo de las claves del cubo, para no colisionar con otros usos de Redis. */
const KEY_PREFIX = 'throttle:';

/**
 * Almacenamiento de rate limit compartido entre réplicas (P3).
 *
 * ## Por qué no alcanza el de memoria
 *
 * El almacenamiento por omisión de `@nestjs/throttler` vive en el proceso. Con
 * N réplicas detrás de un balanceador, el límite efectivo pasa a ser N veces el
 * declarado, y cada despliegue lo reinicia a cero. Para el área con sesión eso
 * es un backstop aceptable; para las doce pantallas públicas —la mayor
 * superficie de ataque del sistema, sin token que atar a nadie— significa que
 * el directorio se raspa entero en una tarde repartiendo las peticiones.
 *
 * ## La cuenta es atómica
 *
 * `INCR` + `PEXPIRE` en un pipeline: el `INCR` crea la clave en 1 si no existía
 * y el `PEXPIRE` sólo se aplica cuando la cuenta es 1, de modo que la ventana
 * arranca con la primera petición y **no se renueva** con cada una. Renovarla
 * convertiría la ventana fija en una deslizante que nunca vence, y un cliente
 * constante jamás se toparía con el límite.
 *
 * ## Qué pasa si Redis se cae
 *
 * Se degrada a un cubo en memoria del proceso en vez de rechazar. Es una
 * decisión, no un descuido: fallar cerrado convertiría una caída de Redis en
 * una caída del sitio público entero, y el límite en memoria sigue frenando el
 * raspado masivo desde una sola IP —que es el caso que importa—, sólo que
 * multiplicado por la cantidad de réplicas.
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  /** Cubo de reserva cuando Redis no responde. */
  private readonly local = new Map<
    string,
    { count: number; expiresAt: number }
  >();
  /** Evita repetir el aviso de degradación en cada petición. */
  private degraded = false;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param redis - Cliente compartido; ausente en pruebas y en el generador OpenAPI.
   */
  constructor(
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: RedisClient,
  ) {}

  /**
   * Suma una petición al cubo y devuelve su estado.
   *
   * @param key - Clave del cubo (la arma el guard: IP + ruta + nombre).
   * @param ttl - Ventana en milisegundos.
   * @param limit - Tope de peticiones dentro de la ventana.
   * @param blockDuration - Cuánto bloquear al superar el tope, en milisegundos.
   * @returns Estado del cubo tras contar esta petición.
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): Promise<ThrottlerStorageRecord> {
    if (!this.redis) return this.incrementLocal(key, ttl, limit, blockDuration);

    try {
      const clave = `${KEY_PREFIX}${key}`;
      const [[, totalCrudo], [, restanteCrudo]] = (await this.redis
        .multi()
        .incr(clave)
        .pttl(clave)
        .exec()) as [[Error | null, number], [Error | null, number]];

      const total = Number(totalCrudo);
      let remaining = Number(restanteCrudo);

      // `pttl` devuelve -1 cuando la clave existe sin vencimiento: pasa si el
      // INCR corrió y el PEXPIRE no llegó a aplicarse. Se repone la ventana en
      // vez de dejar una clave inmortal que bloquearía a esa IP para siempre.
      if (total === 1 || remaining < 0) {
        await this.redis.pexpire(clave, ttl);
        remaining = ttl;
      }

      const exceeded = total > limit;
      if (exceeded && blockDuration > remaining) {
        await this.redis.pexpire(clave, blockDuration);
        remaining = blockDuration;
      }

      return {
        totalHits: total,
        timeToExpire: Math.ceil(remaining / 1000),
        isBlocked: exceeded,
        timeToBlockExpire: exceeded ? Math.ceil(remaining / 1000) : 0,
      };
    } catch (err) {
      if (!this.degraded) {
        this.degraded = true;
        this.logger.warn(
          `Redis no responde; el rate limit se degrada a memoria por réplica: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      return this.incrementLocal(key, ttl, limit, blockDuration);
    }
  }

  /** Cubo de reserva, por proceso. */
  private incrementLocal(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
  ): ThrottlerStorageRecord {
    const ahora = Date.now();
    const actual = this.local.get(key);

    if (!actual || actual.expiresAt <= ahora) {
      this.local.set(key, { count: 1, expiresAt: ahora + ttl });
      return {
        totalHits: 1,
        timeToExpire: Math.ceil(ttl / 1000),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    actual.count += 1;
    const exceeded = actual.count > limit;
    if (exceeded)
      actual.expiresAt = Math.max(actual.expiresAt, ahora + blockDuration);

    const remaining = Math.max(actual.expiresAt - ahora, 0);
    return {
      totalHits: actual.count,
      timeToExpire: Math.ceil(remaining / 1000),
      isBlocked: exceeded,
      timeToBlockExpire: exceeded ? Math.ceil(remaining / 1000) : 0,
    };
  }
}
