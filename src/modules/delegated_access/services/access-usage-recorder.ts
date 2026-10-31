import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { zonedParts, DEFAULT_TIME_ZONE } from '../domain';
import { GrantUsageStatsRepository, type UsageDelta } from '../repositories';

/** Cada cuánto se vuelca el buffer a `grant_usage_stats`. */
export const USAGE_FLUSH_INTERVAL_MS = 30_000;
/** Cuántos eventos disparan el volcado antes de tiempo. */
export const USAGE_FLUSH_EVENTS = 200;
/** Tope de bloques en memoria: más allá se descarta lo más viejo (no es evidencia). */
const MAX_BUCKETS = 5_000;
const HOUR_MS = 3_600_000;

/** Un uso de un permiso. */
export interface UsageEvent {
  /** Organización. */
  readonly tenantId: string;
  /** Persona de apoyo. */
  readonly userId: string;
  /** Concesión que decidió. */
  readonly grantId: string;
  /** Átomo (o alias) usado. */
  readonly permissionCode: string;
  /** Efecto de la decisión. */
  readonly effect: 'PERMIT' | 'DENY' | 'CHALLENGE';
  /** Paciente, si la acción lo tiene (para contar distintos por hora). */
  readonly patientProfileId?: string;
  /** Instante. */
  readonly at: Date;
  /** Zona de la organización (para «fuera de horario»). */
  readonly timeZone?: string;
}

interface Bucket {
  delta: UsageDelta;
  patients: Set<string>;
}

/** ¿Fuera de 07:00-20:00 en la zona de la organización? (regla de anomalía §6.6 por defecto) */
export function isOffHours(at: Date, timeZone: string | undefined): boolean {
  const parts = zonedParts(at, timeZone ?? DEFAULT_TIME_ZONE);
  if (!parts) return false;
  return parts.hour < 7 || parts.hour >= 20;
}

/**
 * Estadística de uso por permiso y hora (`grant_usage_stats`), derivada y NO
 * evidencia: se acumula en el proceso y se vuelca cada 30 s o cada 200 eventos
 * con un UPSERT que suma. Perder hasta 30 s de estadística en una caída es
 * aceptable; la evidencia es `audit_log` y `access_decision_log`.
 *
 * No es parte del camino de la decisión: `note` nunca lanza ni espera a la base.
 */
@Injectable()
export class AccessUsageRecorder implements OnModuleDestroy {
  private buckets = new Map<string, Bucket>();
  private pending = 0;
  private timer?: NodeJS.Timeout;
  private flushing?: Promise<void>;

  /**
   * @param em - Contexto de persistencia.
   * @param repo - Estadística de uso.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: GrantUsageStatsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AccessUsageRecorder.name);
  }

  /**
   * Anota un uso en el buffer.
   *
   * @param event - El uso.
   */
  note(event: UsageEvent): void {
    const bucketStart = new Date(
      Math.floor(event.at.getTime() / HOUR_MS) * HOUR_MS,
    );
    const key = [
      event.tenantId,
      event.grantId,
      event.permissionCode,
      bucketStart.getTime(),
    ].join('|');
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= MAX_BUCKETS) {
        const oldest = this.buckets.keys().next().value;
        if (oldest !== undefined) this.buckets.delete(oldest);
      }
      bucket = {
        delta: {
          tenantId: event.tenantId,
          userId: event.userId,
          supportScopeGrantId: event.grantId,
          permissionCode: event.permissionCode,
          bucketStart,
          permit: 0,
          deny: 0,
          challenge: 0,
          offHours: 0,
          distinctPatients: 0,
          lastUsedAt: event.at,
        },
        patients: new Set(),
      };
      this.buckets.set(key, bucket);
    }
    const d = bucket.delta;
    const next: UsageDelta = {
      ...d,
      permit: d.permit + (event.effect === 'PERMIT' ? 1 : 0),
      deny: d.deny + (event.effect === 'DENY' ? 1 : 0),
      challenge: d.challenge + (event.effect === 'CHALLENGE' ? 1 : 0),
      offHours:
        d.offHours +
        (event.effect === 'PERMIT' && isOffHours(event.at, event.timeZone)
          ? 1
          : 0),
      lastUsedAt: event.at,
    };
    if (event.effect === 'PERMIT' && event.patientProfileId) {
      bucket.patients.add(event.patientProfileId);
    }
    bucket.delta = { ...next, distinctPatients: bucket.patients.size };
    this.pending += 1;
    if (this.pending >= USAGE_FLUSH_EVENTS) void this.flush();
    else this.arm();
  }

  /** Arma el temporizador de volcado (una sola vez, sin retener el proceso). */
  private arm(): void {
    if (this.timer) return;
    this.timer = setInterval(() => void this.flush(), USAGE_FLUSH_INTERVAL_MS);
    this.timer.unref();
  }

  /**
   * Vuelca el buffer. Nunca lanza: si falla, devuelve los bloques al buffer
   * (acotado) y avisa.
   */
  flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    const taken = [...this.buckets.values()].map((b) => b.delta);
    if (taken.length === 0) return Promise.resolve();
    this.buckets = new Map();
    this.pending = 0;
    this.flushing = this.repo
      .upsertBuckets(this.em.fork(), taken)
      .catch((err: unknown) => {
        this.logger.warn(
          {
            operation: 'delegated_access.usage.flush',
            buckets: taken.length,
            err: err instanceof Error ? err.message : String(err),
          },
          'No se pudo volcar la estadística de uso; se reintenta con el siguiente lote',
        );
        for (const delta of taken) this.restore(delta);
      })
      .finally(() => {
        this.flushing = undefined;
      });
    return this.flushing;
  }

  /** Devuelve un bloque que no se pudo volcar: suma sus contadores al del buffer. */
  private restore(delta: UsageDelta): void {
    const key = [
      delta.tenantId,
      delta.supportScopeGrantId,
      delta.permissionCode,
      delta.bucketStart.getTime(),
    ].join('|');
    const current = this.buckets.get(key);
    if (current) {
      const d = current.delta;
      current.delta = {
        ...d,
        permit: d.permit + delta.permit,
        deny: d.deny + delta.deny,
        challenge: d.challenge + delta.challenge,
        offHours: d.offHours + delta.offHours,
        distinctPatients: Math.max(d.distinctPatients, delta.distinctPatients),
      };
    } else if (this.buckets.size < MAX_BUCKETS) {
      this.buckets.set(key, { delta, patients: new Set() });
    }
  }

  /** Al apagar el proceso, deja lo que quede en el buffer. */
  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.flush();
  }
}
