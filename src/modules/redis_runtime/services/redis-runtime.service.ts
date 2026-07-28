import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { PinoLogger } from 'nestjs-pino';
import { PreconditionFailedException } from '../../../common';
import { REDIS_CLIENT, type RedisClient } from '../redis.provider';

/** Resultado de un contador con ventana (rate/uso). */
export interface CounterWindowResult {
  /** Valor actual del contador dentro de la ventana. */
  readonly count: number;
  /** Segundos restantes hasta que la ventana expire (-1 si sin TTL). */
  readonly ttlSec: number;
}

/** Resultado de intentar adquirir un lock distribuido. */
export interface LockAcquisition {
  /** Si se obtuvo el lock. */
  readonly acquired: boolean;
  /** Token del titular; necesario para liberar. Sólo presente si `acquired`. */
  readonly token?: string;
}

/**
 * Script Lua de liberación de lock con CAS: sólo borra la clave si su valor
 * coincide con el token del titular, evitando que un proceso libere el lock de
 * otro tras una expiración. Es un script fijo e interno: el módulo NO expone
 * `EVAL` arbitrario a los clientes.
 */
const RELEASE_LOCK_LUA = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end`;

/**
 * Runtime de baja latencia sobre Redis: caché con TTL, contadores con ventana,
 * locks distribuidos y challenge store (p. ej. OTP). TODAS las operaciones
 * quedan acotadas al tenant: las claves se prefijan con `{tenantId}:...`, de modo
 * que ningún tenant puede leer o pisar el espacio de otro.
 */
@Injectable()
export class RedisRuntimeService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisRuntimeService.name);
  }

  /**
   * ComponE la clave física namespaced por tenant. Rechaza tenant/clave vacíos
   * para que jamás se emita una clave sin prefijo (que sería cross-tenant).
   */
  private keyFor(tenant: string, kind: string, key: string): string {
    if (!tenant) {
      throw new PreconditionFailedException(
        'Operación de runtime sin tenant en contexto',
      );
    }
    if (!key) {
      throw new PreconditionFailedException('Clave de runtime vacía');
    }
    return `${tenant}:${kind}:${key}`;
  }

  // --- Caché con TTL -------------------------------------------------------

  /** Escribe `value` bajo `key` con expiración `ttlSec` (segundos). */
  async setWithTtl(
    tenant: string,
    key: string,
    value: string,
    ttlSec: number,
  ): Promise<void> {
    await this.redis.set(this.keyFor(tenant, 'cache', key), value, 'EX', ttlSec);
  }

  /** Lee el valor de `key`, o `null` si no existe / expiró. */
  get(tenant: string, key: string): Promise<string | null> {
    return this.redis.get(this.keyFor(tenant, 'cache', key));
  }

  /** Borra `key`; devuelve `true` si existía. */
  async del(tenant: string, key: string): Promise<boolean> {
    const removed = await this.redis.del(this.keyFor(tenant, 'cache', key));
    return removed > 0;
  }

  // --- Contadores con ventana (rate / uso) ---------------------------------

  /**
   * Incrementa un contador y, en el primer incremento de la ventana, le fija un
   * TTL de `windowSec`. Sirve para límites de tasa o cuotas de uso por clave.
   */
  async incrWithWindow(
    tenant: string,
    key: string,
    windowSec: number,
  ): Promise<CounterWindowResult> {
    const fullKey = this.keyFor(tenant, 'counter', key);
    const count = await this.redis.incr(fullKey);
    if (count === 1) {
      await this.redis.expire(fullKey, windowSec);
    }
    const ttlSec = await this.redis.ttl(fullKey);
    return { count, ttlSec };
  }

  // --- Locks distribuidos --------------------------------------------------

  /**
   * Adquiere un lock con `SET key token NX PX ttlMs`. Devuelve el token del
   * titular (necesario para liberar) sólo si se obtuvo.
   */
  async acquireLock(
    tenant: string,
    key: string,
    ttlSec: number,
  ): Promise<LockAcquisition> {
    const fullKey = this.keyFor(tenant, 'lock', key);
    const token = randomBytes(16).toString('hex');
    const ok = await this.redis.set(fullKey, token, 'PX', ttlSec * 1000, 'NX');
    return ok === 'OK' ? { acquired: true, token } : { acquired: false };
  }

  /**
   * Libera el lock sólo si el `token` coincide con el titular (CAS vía Lua).
   * Devuelve `true` si se borró.
   */
  async releaseLock(tenant: string, key: string, token: string): Promise<boolean> {
    const fullKey = this.keyFor(tenant, 'lock', key);
    const removed = (await this.redis.eval(
      RELEASE_LOCK_LUA,
      1,
      fullKey,
      token,
    )) as number;
    return removed === 1;
  }

  // --- Challenge store (OTP y similares) -----------------------------------

  /**
   * Guarda un challenge (p. ej. OTP) como hash con TTL. Nunca persiste el
   * secreto en claro: almacena su SHA-256 para que `verifyChallenge` valide sin
   * poder reconstruirlo.
   */
  async putChallenge(
    tenant: string,
    key: string,
    secret: string,
    ttlSec: number,
  ): Promise<void> {
    const digest = this.hashSecret(secret);
    await this.redis.set(
      this.keyFor(tenant, 'challenge', key),
      digest,
      'EX',
      ttlSec,
    );
  }

  /**
   * Valida un challenge contra el secreto almacenado y lo CONSUME al acertar
   * (single-use). Devuelve `false` si no existe, expiró o no coincide. La
   * comparación es de tiempo constante para no filtrar el hash por temporización.
   *
   * Gancho de integración: `common/services/contact-points.service.ts` puede
   * llamar aquí para dejar de marcar `verified=true` a ciegas y exigir un OTP
   * previamente emitido con `putChallenge`.
   */
  async verifyChallenge(
    tenant: string,
    key: string,
    candidate: string,
  ): Promise<boolean> {
    const fullKey = this.keyFor(tenant, 'challenge', key);
    const stored = await this.redis.get(fullKey);
    if (stored === null) {
      return false;
    }
    if (!this.constantTimeEquals(stored, this.hashSecret(candidate))) {
      return false;
    }
    // Consumo single-use: sólo se borra si acertó (permite reintentos válidos
    // hasta el TTL, pero un acierto invalida el challenge).
    await this.redis.del(fullKey);
    return true;
  }

  private hashSecret(secret: string): string {
    return createHash('sha256').update(secret, 'utf8').digest('hex');
  }

  private constantTimeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
