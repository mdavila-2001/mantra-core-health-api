import { Inject, Injectable, Optional } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  REDIS_CLIENT,
  type RedisClient,
} from '../../redis_runtime/redis.provider';
import {
  SEARCH_ANOMALY_RATIO,
  evaluateSearchRate,
  ipSearchLimitsFromEnv,
  searchLimitsFromEnv,
  slidingEstimate,
  type SearchLimits,
} from '../domain';

/** A quién se le cuenta el intento. */
export type ProbeScope = 'PERSON' | 'IP';

/** Ventana del tope. */
export type ProbeWindow = 'MINUTE' | 'DAY';

/** Qué tope se superó. */
export interface ProbeExceeded {
  readonly scope: ProbeScope;
  readonly window: ProbeWindow;
}

/** Veredicto de un intento de consulta de pacientes. */
export interface ProbeVerdict {
  /** ¿Se admite el intento? */
  readonly allowed: boolean;
  /** Tope superado, si se negó. */
  readonly exceeded?: ProbeExceeded;
  /**
   * ¿Es el primer rechazo de la racha? Solo ese pide sello en la bitácora: sellar
   * cada rechazo dejaría a quien insiste escribiendo en la cadena a voluntad.
   */
  readonly firstOverflow: boolean;
}

/** Un contador de ventana: de quién, de qué ventana y su tope. */
interface Counter {
  readonly scope: ProbeScope;
  readonly window: ProbeWindow;
  readonly id: string;
  readonly limit: number;
}

const KEY_PREFIX = 'support-patient-probe';

const WINDOW_MS: Readonly<Record<ProbeWindow, number>> = {
  MINUTE: 60 * 1000,
  DAY: 24 * 3600 * 1000,
};

/** Tamaño a partir del cual se barren las entradas vencidas de la reserva local. */
const LOCAL_SWEEP_SIZE = 10_000;

/**
 * Contador atómico de consultas de pacientes del personal de apoyo (búsqueda y
 * alta rápida, que comparten tope).
 *
 * ## Por qué no se cuenta con la bitácora
 *
 * El tope anterior contaba filas de `audit.audit_log`: por organización (con RLS
 * la lectura corre bajo el tenant del cuerpo), sin lo que se revierte con la
 * transacción, sin lo que no deja asiento y con lectura-comprobación-escritura
 * sin bloqueo. Este contador es de la persona en TODAS las organizaciones y de la
 * IP de origen; se incrementa ANTES de consultar y FUERA de la transacción de
 * negocio —así un intento que acaba en excepción o en rollback también cuenta—, y
 * cuenta todo intento, también el rechazado.
 *
 * ## Cómo cuenta
 *
 * `INCR` en un `MULTI` (atómico: N peticiones paralelas ven N contadores
 * distintos) sobre dos ventanas fijas contiguas, que se combinan en una ventana
 * deslizante ({@link slidingEstimate}): sin ella, 20 intentos al final de un
 * minuto y 20 al principio del siguiente serían 40 en dos segundos.
 *
 * ## Si Redis se cae
 *
 * Mismo criterio que `RedisThrottlerStorage`: se degrada a un contador en
 * memoria del proceso (con aviso) en vez de dejar sin servicio al mostrador. El
 * tope sigue valiendo por réplica.
 */
@Injectable()
export class SupportPatientProbeCounter {
  /** Reserva en memoria cuando Redis no responde. */
  private readonly local = new Map<
    string,
    { count: number; expiresAt: number }
  >();
  /** Última ventana en que se avisó, por (alcance, quién, ventana): un aviso por ventana. */
  private readonly warned = new Map<string, number>();
  /** Evita repetir el aviso de degradación en cada intento. */
  private degraded = false;

  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param logger - Logger estructurado.
   * @param redis - Cliente compartido; ausente en pruebas y en el generador OpenAPI.
   */
  constructor(
    private readonly logger: PinoLogger,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: RedisClient,
  ) {
    this.logger.setContext(SupportPatientProbeCounter.name);
  }

  /**
   * Cuenta un intento de consulta y dice si se admite.
   *
   * @param userId - Persona de apoyo (todas sus organizaciones comparten cupo).
   * @param ip - IP de origen; sin ella solo cuenta por persona.
   * @param now - Instante del intento (milisegundos).
   * @returns El veredicto; un intento rechazado también quedó contado.
   */
  async hit(
    userId: string,
    ip?: string,
    now: number = Date.now(),
  ): Promise<ProbeVerdict> {
    const person = searchLimitsFromEnv(process.env);
    const origin = ipSearchLimitsFromEnv(process.env);
    const counters: Counter[] = [
      ...this.countersOf('PERSON', userId, person),
      ...(ip ? this.countersOf('IP', ip, origin) : []),
    ];
    const estimates = await this.increment(counters, now);

    let exceeded: ProbeExceeded | undefined;
    let firstOverflow = false;
    counters.forEach((counter, index) => {
      const estimate = estimates[index];
      if (estimate > counter.limit && !exceeded) {
        exceeded = { scope: counter.scope, window: counter.window };
        firstOverflow = estimate === counter.limit + 1;
      }
    });
    this.alarm(counters, estimates, now, userId);
    return exceeded
      ? { allowed: false, exceeded, firstOverflow }
      : { allowed: true, firstOverflow: false };
  }

  /** Los dos contadores (minuto y día) de una persona o de una IP. */
  private countersOf(
    scope: ProbeScope,
    id: string,
    limits: SearchLimits,
  ): Counter[] {
    return [
      { scope, window: 'MINUTE', id, limit: limits.perMinute },
      { scope, window: 'DAY', id, limit: limits.perDay },
    ];
  }

  /** Clave de un contador en una ventana fija. */
  private keyOf(counter: Counter, bucket: number): string {
    return `${KEY_PREFIX}:${counter.scope === 'PERSON' ? 'person' : 'ip'}:${
      counter.id
    }:${counter.window === 'MINUTE' ? 'minute' : 'day'}:${bucket}`;
  }

  /** Suma el intento a cada contador y devuelve el estimado de cada ventana deslizante. */
  private async increment(
    counters: readonly Counter[],
    now: number,
  ): Promise<number[]> {
    if (!this.redis) return this.incrementLocal(counters, now);
    try {
      const multi = this.redis.multi();
      for (const counter of counters) {
        const span = WINDOW_MS[counter.window];
        const bucket = Math.floor(now / span);
        const current = this.keyOf(counter, bucket);
        multi.incr(current);
        // Dos ventanas de vida: la anterior todavía pesa en la estimación.
        multi.pexpire(current, span * 2);
        multi.get(this.keyOf(counter, bucket - 1));
      }
      const replies = await multi.exec();
      if (!replies || replies.length !== counters.length * 3) {
        throw new Error('MULTI sin respuesta completa');
      }
      const estimates = counters.map((counter, index) => {
        const [errIncr, current] = replies[index * 3];
        const [errPexpire] = replies[index * 3 + 1];
        const [errGet, previous] = replies[index * 3 + 2];
        const failure = errIncr ?? errPexpire ?? errGet;
        if (failure) throw failure;
        const span = WINDOW_MS[counter.window];
        return slidingEstimate(
          Number(current),
          Number(previous ?? 0),
          (now % span) / span,
        );
      });
      this.degraded = false;
      return estimates;
    } catch (err) {
      if (!this.degraded) {
        this.degraded = true;
        this.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Redis no responde; el tope de consultas de pacientes se degrada a memoria por réplica',
        );
      }
      return this.incrementLocal(counters, now);
    }
  }

  /** Reserva en memoria: mismas ventanas y misma estimación, por proceso. */
  private incrementLocal(counters: readonly Counter[], now: number): number[] {
    if (this.local.size > LOCAL_SWEEP_SIZE) {
      for (const [key, entry] of this.local) {
        if (entry.expiresAt <= now) this.local.delete(key);
      }
    }
    return counters.map((counter) => {
      const span = WINDOW_MS[counter.window];
      const bucket = Math.floor(now / span);
      const key = this.keyOf(counter, bucket);
      const entry = this.local.get(key);
      const count = (entry?.count ?? 0) + 1;
      this.local.set(key, { count, expiresAt: now + span * 2 });
      const previous = this.local.get(this.keyOf(counter, bucket - 1));
      const live = previous && previous.expiresAt > now ? previous.count : 0;
      return slidingEstimate(count, live, (now % span) / span);
    });
  }

  /** Aviso al llegar al 80% del tope (o al superarlo): una vez por ventana. */
  private alarm(
    counters: readonly Counter[],
    estimates: readonly number[],
    now: number,
    userId: string,
  ): void {
    const byScope = new Map<ProbeScope, Counter[]>();
    counters.forEach((counter) => {
      byScope.set(counter.scope, [
        ...(byScope.get(counter.scope) ?? []),
        counter,
      ]);
    });
    for (const [scope, pair] of byScope) {
      const [minute, day] = pair;
      const at = (counter: Counter): number =>
        estimates[counters.indexOf(counter)];
      const limits: SearchLimits = {
        perMinute: minute.limit,
        perDay: day.limit,
      };
      const verdict = evaluateSearchRate(
        { lastMinute: at(minute) - 1, lastDay: at(day) - 1 },
        limits,
      );
      if (!verdict.anomalous) continue;
      const window: ProbeWindow =
        verdict.exceeded ??
        (at(minute) >= limits.perMinute * SEARCH_ANOMALY_RATIO
          ? 'MINUTE'
          : 'DAY');
      const counter = window === 'MINUTE' ? minute : day;
      const bucket = Math.floor(now / WINDOW_MS[window]);
      const memo = `${scope}:${counter.id}:${window}`;
      if (this.warned.get(memo) === bucket) continue;
      if (this.warned.size > LOCAL_SWEEP_SIZE) this.warned.clear();
      this.warned.set(memo, bucket);
      this.logger.warn(
        {
          operation: 'delegated_access.support_patient_probe.anomaly',
          userId,
          scope,
          ...(scope === 'IP' ? { ip: counter.id } : {}),
          window,
          attempts: at(counter),
          limit: counter.limit,
          exceeded: verdict.exceeded !== undefined,
        },
        'Volumen anómalo de consultas de pacientes del personal de apoyo',
      );
    }
  }
}
