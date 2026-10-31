import { Inject, Injectable, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../redis_runtime/redis.provider';
import type { UsageKey, UsageReading } from '../domain';

/** Una lectura pedida: la clave y el tope contra el que se mide. */
export interface UsagePeek {
  readonly key: UsageKey;
  readonly max: number;
}

/** Un consumo pedido: la clave, cuánto sumar y el tope que no se puede pasar. */
export interface UsageConsume {
  readonly key: UsageKey;
  readonly amount: number;
  readonly max: number;
}

/** Resultado de consumir: todo o nada. */
export interface UsageConsumeResult {
  /** `true` si TODOS los consumos entraron en su tope. */
  readonly ok: boolean;
  /** Clave que se pasó del tope, si no entró. */
  readonly exceeded?: UsageKey;
}

const PREFIX = 'support-usage:v1';
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const LOCAL_SWEEP_SIZE = 10_000;
/** Cuánto se espera a Redis antes de degradar a memoria. */
const REDIS_TIMEOUT_MS = 1500;

/** Forma de guardar cada métrica. */
type Kind = 'COUNTER' | 'SET' | 'WINDOW';

/**
 * Lua atómico «verificar y consumir todo o nada». Por cada ítem `i`: `KEYS[i]`
 * es la clave y `ARGV` trae, tras la cantidad, siete valores por ítem:
 * `kind` (1 contador, 2 conjunto, 3 ventana deslizante), `max`, `amount`, `ttl`
 * (segundos), `member`, `cutoff` y `now` (milisegundos). Devuelve 0 si entran
 * todos o el índice (base 1) del primero que se pasa del tope; no escribe nada
 * si alguno se pasa.
 */
const CONSUME_LUA = `
local n = tonumber(ARGV[1])
local items = {}
local p = 2
for i = 1, n do
  items[i] = {
    kind = tonumber(ARGV[p]), max = tonumber(ARGV[p + 1]),
    amount = tonumber(ARGV[p + 2]), ttl = tonumber(ARGV[p + 3]),
    member = ARGV[p + 4], cutoff = tonumber(ARGV[p + 5]), now = tonumber(ARGV[p + 6])
  }
  p = p + 7
end
for i = 1, n do
  local it = items[i]
  local key = KEYS[i]
  if it.kind == 1 then
    local used = tonumber(redis.call('GET', key) or '0')
    if used + it.amount > it.max then return i end
  elseif it.kind == 2 then
    if redis.call('SISMEMBER', key, it.member) == 0 then
      if redis.call('SCARD', key) + 1 > it.max then return i end
    end
  else
    redis.call('ZREMRANGEBYSCORE', key, '-inf', it.cutoff)
    if it.member ~= '' and redis.call('ZSCORE', key, it.member) then
      -- ya contado en la ventana: solo se renueva
    elseif redis.call('ZCARD', key) + it.amount > it.max then return i end
  end
end
for i = 1, n do
  local it = items[i]
  local key = KEYS[i]
  if it.kind == 1 then
    redis.call('INCRBY', key, it.amount)
    redis.call('EXPIRE', key, it.ttl)
  elseif it.kind == 2 then
    redis.call('SADD', key, it.member)
    redis.call('EXPIRE', key, it.ttl)
  else
    for j = 1, it.amount do
      local member = it.member
      if member == '' then member = it.now .. ':' .. j .. ':' .. redis.call('INCR', key .. ':seq') end
      redis.call('ZADD', key, it.now, member)
    end
    redis.call('EXPIRE', key, it.ttl)
    redis.call('EXPIRE', key .. ':seq', it.ttl)
  end
end
return 0
`;

/** Estado en memoria cuando Redis no responde. */
interface LocalEntry {
  /** Contador o suma. */
  count: number;
  /** Miembros (conjuntos y ventanas): miembro → instante. */
  members: Map<string, number>;
  expiresAt: number;
}

/**
 * Contadores de `limits` y `amount` de las condiciones de apoyo
 * (CONTRATO-GOBIERNO §3.4), en Redis con el mismo patrón y la misma degradación
 * que `SupportPatientProbeCounter`.
 *
 * ## Qué cuenta
 *
 * - `ACTIONS`: decisiones `PERMIT` del átomo o del grupo. `HOUR` es una ventana
 *   deslizante exacta de 60 min (conjunto ordenado por instante); `DAY` y `WEEK`
 *   son el periodo calendario de la zona de la organización (clave por periodo).
 * - `DISTINCT_PATIENTS`: pacientes distintos (conjunto con TTL del periodo;
 *   ventana deslizante en `HOUR`).
 * - `AMOUNT`: suma de montos del día, en unidades menores.
 *
 * ## `peek` y `consume`
 *
 * `peek` solo lee (lo usan la decisión previa y `explain`/`simulate`); `consume`
 * verifica Y suma en un único script Lua, todo o nada: con diez peticiones
 * simultáneas al penúltimo cupo entra una. Una acción que luego falla (400/409)
 * YA consumió: es conservador, igual que el contador de búsquedas.
 *
 * ## Si Redis se cae
 *
 * Se degrada a memoria del proceso con aviso: el tope sigue valiendo por réplica,
 * **no se abre** (nunca se devuelve «0 usados» por no saber).
 */
@Injectable()
export class SupportUsageCounter {
  private readonly local = new Map<string, LocalEntry>();
  private degraded = false;

  /**
   * @param logger - Logger estructurado.
   * @param redis - Cliente compartido; ausente en pruebas y en el generador OpenAPI.
   */
  constructor(
    private readonly logger: PinoLogger,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: RedisClient,
  ) {
    this.logger.setContext(SupportUsageCounter.name);
  }

  /**
   * Lee cuánto llevan las claves, sin consumir nada.
   *
   * @param tenantId - Organización de la decisión.
   * @param peeks - Claves y topes.
   * @param now - Instante de la decisión.
   * @returns Lectura por clave (ver {@link SupportUsageCounter.serialize}).
   */
  async peek(
    tenantId: string,
    peeks: readonly UsagePeek[],
    now: Date = new Date(),
  ): Promise<Map<string, UsageReading>> {
    const out = new Map<string, UsageReading>();
    if (peeks.length === 0) return out;
    const read = async (): Promise<void> => {
      const redis = this.redis;
      if (!redis) throw new Error('sin Redis');
      for (const { key, max } of peeks) {
        const redisKey = this.keyOf(tenantId, key);
        const kind = kindOf(key);
        let used = 0;
        let already = false;
        if (kind === 'COUNTER') {
          used = Number((await this.guard(redis.get(redisKey))) ?? 0);
        } else if (kind === 'SET') {
          used = await this.guard(redis.scard(redisKey));
          already =
            !!key.patientProfileId &&
            (await this.guard(
              redis.sismember(redisKey, key.patientProfileId),
            )) === 1;
        } else {
          const cutoff = now.getTime() - HOUR_MS;
          used = await this.guard(redis.zcount(redisKey, `(${cutoff}`, '+inf'));
          already =
            !!key.patientProfileId &&
            Number(
              (await this.guard(
                redis.zscore(redisKey, key.patientProfileId),
              )) ?? -1,
            ) > cutoff;
        }
        out.set(
          SupportUsageCounter.serialize(key),
          reading(used, max, already),
        );
      }
    };
    try {
      await read();
      this.degraded = false;
    } catch (err) {
      this.warnDegraded(err);
      out.clear();
      for (const { key, max } of peeks) {
        out.set(
          SupportUsageCounter.serialize(key),
          this.peekLocal(tenantId, key, max, now),
        );
      }
    }
    return out;
  }

  /**
   * Verifica y suma, todo o nada y de forma atómica.
   *
   * @param tenantId - Organización de la decisión.
   * @param requests - Consumos con su tope.
   * @param now - Instante de la decisión.
   * @returns `ok`, o la primera clave que se pasó del tope (no se escribió nada).
   */
  async consume(
    tenantId: string,
    requests: readonly UsageConsume[],
    now: Date = new Date(),
  ): Promise<UsageConsumeResult> {
    if (requests.length === 0) return { ok: true };
    try {
      const redis = this.redis;
      if (!redis) throw new Error('sin Redis');
      const keys = requests.map((r) => this.keyOf(tenantId, r.key));
      const args: (string | number)[] = [requests.length];
      for (const r of requests) {
        const kind = kindOf(r.key);
        args.push(
          kind === 'COUNTER' ? 1 : kind === 'SET' ? 2 : 3,
          r.max,
          r.amount,
          ttlSeconds(r.key),
          r.key.patientProfileId ?? '',
          now.getTime() - HOUR_MS,
          now.getTime(),
        );
      }
      const failed = Number(
        await this.guard(
          redis.eval(CONSUME_LUA, keys.length, ...keys, ...args) as Promise<
            number | string
          >,
        ),
      );
      this.degraded = false;
      return failed === 0
        ? { ok: true }
        : { ok: false, exceeded: requests[failed - 1].key };
    } catch (err) {
      this.warnDegraded(err);
      return this.consumeLocal(tenantId, requests, now);
    }
  }

  /** Clave estable de una lectura en los mapas que devuelve `peek`. */
  static serialize(key: UsageKey): string {
    return JSON.stringify([
      key.metric,
      key.per,
      key.period,
      key.scope,
      key.subject,
      key.bucket,
      key.patientProfileId ?? '',
    ]);
  }

  /** Clave de Redis. El paciente va dentro del conjunto, no de la clave. */
  private keyOf(tenantId: string, key: UsageKey): string {
    return [
      PREFIX,
      tenantId,
      key.metric,
      key.per,
      key.period,
      key.scope,
      key.subject,
      key.bucket,
    ].join(':');
  }

  /** Una llamada a Redis con plazo: si no responde, es «no disponible». */
  private guard<T>(call: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Redis sin responder')),
        REDIS_TIMEOUT_MS,
      );
      call.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }

  private warnDegraded(err: unknown): void {
    if (this.degraded) return;
    this.degraded = true;
    this.logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      'Redis no responde; los contadores de límites de apoyo se degradan a memoria por réplica (no se abre ningún tope)',
    );
  }

  // ───────────────────────── memoria del proceso ─────────────────────────

  private entryOf(
    id: string,
    now: number,
    create: boolean,
    ttlMs: number,
  ): LocalEntry | undefined {
    if (this.local.size > LOCAL_SWEEP_SIZE) {
      for (const [k, e] of this.local)
        if (e.expiresAt <= now) this.local.delete(k);
    }
    const found = this.local.get(id);
    if (found && found.expiresAt > now) return found;
    if (!create) return undefined;
    const fresh: LocalEntry = {
      count: 0,
      members: new Map(),
      expiresAt: now + ttlMs,
    };
    this.local.set(id, fresh);
    return fresh;
  }

  private peekLocal(
    tenantId: string,
    key: UsageKey,
    max: number,
    now: Date,
  ): UsageReading {
    const at = now.getTime();
    const entry = this.entryOf(this.keyOf(tenantId, key), at, false, 0);
    const kind = kindOf(key);
    if (!entry) return reading(0, max, false);
    if (kind === 'COUNTER') return reading(entry.count, max, false);
    const live = [...entry.members.entries()].filter(
      ([, instant]) => kind === 'SET' || instant > at - HOUR_MS,
    );
    const already =
      !!key.patientProfileId &&
      live.some(([member]) => member === key.patientProfileId);
    return reading(live.length, max, already);
  }

  private consumeLocal(
    tenantId: string,
    requests: readonly UsageConsume[],
    now: Date,
  ): UsageConsumeResult {
    const at = now.getTime();
    for (const r of requests) {
      const reading = this.peekLocal(tenantId, r.key, r.max, now);
      const kind = kindOf(r.key);
      if (kind === 'COUNTER') {
        if (reading.used + r.amount > r.max)
          return { ok: false, exceeded: r.key };
      } else if (!reading.alreadyCounted && reading.used + r.amount > r.max) {
        return { ok: false, exceeded: r.key };
      }
    }
    requests.forEach((r, index) => {
      const kind = kindOf(r.key);
      const entry = this.entryOf(
        this.keyOf(tenantId, r.key),
        at,
        true,
        ttlSeconds(r.key) * 1000,
      ) as LocalEntry;
      if (kind === 'COUNTER') entry.count += r.amount;
      else {
        const member =
          r.key.patientProfileId ?? `${at}:${index}:${entry.members.size}`;
        entry.members.set(member, at);
      }
    });
    return { ok: true };
  }
}

/** Cómo se guarda una clave: suma, conjunto de pacientes o ventana deslizante. */
function kindOf(key: UsageKey): Kind {
  if (key.metric === 'DISTINCT_PATIENTS') {
    return key.per === 'HOUR' ? 'WINDOW' : 'SET';
  }
  if (key.metric === 'ACTIONS' && key.per === 'HOUR') return 'WINDOW';
  return 'COUNTER';
}

/** Vida de la clave: el periodo y un margen (la ventana horaria, dos horas). */
function ttlSeconds(key: UsageKey): number {
  const ms =
    key.per === 'HOUR'
      ? 2 * HOUR_MS
      : key.per === 'DAY'
        ? 2 * DAY_MS
        : 8 * DAY_MS;
  return Math.ceil(ms / 1000);
}

function reading(
  used: number,
  max: number,
  alreadyCounted: boolean,
): UsageReading {
  return {
    used,
    remaining: Math.max(0, max - used),
    ...(alreadyCounted ? { alreadyCounted: true } : {}),
  };
}
