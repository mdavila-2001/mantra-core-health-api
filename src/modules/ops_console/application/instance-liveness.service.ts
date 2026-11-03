import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { DomainException, ErrorCode } from '../../../common';
import {
  AppReadinessService,
  type DependencyStatus,
} from '../../../app-readiness.service';
import {
  INSTANCE_LIVENESS_MODEL_VERSION,
  evaluateInstance,
  overallOf,
  summarize,
  type InstanceEvaluation,
  type LivenessSummary,
  type OverallState,
  type ProbeOutcome,
} from '../domain/instance-liveness';
import type { InstanceLivenessEnv } from '../domain/instance-liveness.env';
import {
  KNOWN_WORKER_IDS,
  NOT_MEASURED,
  PROBED_DEPENDENCIES,
  buildInstanceRegistry,
  type InstanceDefinition,
} from '../domain/instance-registry';
import {
  InstanceHeartbeatRepository,
  type StoredHeartbeat,
} from '../infrastructure/repositories/instance-heartbeat.repository';

/** Token del entorno validado al arrancar (`loadInstanceLivenessEnv`). */
export const INSTANCE_LIVENESS_ENV = Symbol('INSTANCE_LIVENESS_ENV');

/** Las sondas de dependencia se reutilizan durante esta ventana. */
export const PROBE_CACHE_TTL_MS = 10_000;

/** Sub-código del 422 cuando el latido viene de una instancia fuera del registro. */
export const INSTANCE_UNKNOWN_REASON = 'INSTANCE_UNKNOWN';

/** Cuerpo de `GET /admin/ops/instances/liveness` (`instance-liveness/v1`). */
export interface InstanceLivenessResponse {
  modelVersion: typeof INSTANCE_LIVENESS_MODEL_VERSION;
  evaluatedAt: string;
  overall: OverallState;
  summary: LivenessSummary;
  heartbeatStore: { status: 'up' | 'down'; reason: 'STORE_UNAVAILABLE' | null };
  thresholds: {
    workerHeartbeatIntervalSeconds: number;
    degradedAfterSeconds: number;
    downAfterSeconds: number;
    dependencyLatencyDegradedMs: number;
    dependencyProbeTimeoutMs: number;
    clockToleranceSeconds: number;
  };
  instances: InstanceEvaluation[];
  notMeasured: string[];
}

/** Lo que recibe la ingesta; ya validado por el DTO. */
export type HeartbeatInput = Omit<StoredHeartbeat, 'receivedAt'>;

interface ProbeCache {
  takenAt: number;
  probes: Record<string, ProbeOutcome>;
}

/**
 * Orquesta la sonda de vida: guarda latidos con el reloj de la API, lee la
 * flota, sonda las dependencias (con caché de 10 s) y delega la decisión en el
 * dominio puro. Responde siempre, también con Redis caído: ahí la respuesta
 * dice `heartbeatStore.status='down'` y los workers quedan `SIN_DATO`.
 */
@Injectable()
export class InstanceLivenessService {
  private readonly logger = new Logger(InstanceLivenessService.name);
  private readonly registry: readonly InstanceDefinition[];
  /** Arranque de este proceso; un cambio entre consultas es un reinicio observado. */
  private readonly apiStartedAt = new Date(
    Date.now() - Math.round(process.uptime() * 1000),
  ).toISOString();
  private probeCache?: ProbeCache;
  private probePending?: Promise<Record<string, ProbeOutcome>>;

  constructor(
    private readonly heartbeats: InstanceHeartbeatRepository,
    private readonly readiness: AppReadinessService,
    @Inject(INSTANCE_LIVENESS_ENV) private readonly env: InstanceLivenessEnv,
  ) {
    this.registry = buildInstanceRegistry(env.requiredWorkers);
  }

  /** Ingesta de un latido. Rechaza instancias fuera del registro sin guardar nada. */
  async recordHeartbeat(
    input: HeartbeatInput,
    now: number = Date.now(),
  ): Promise<{ instanceId: string; receivedAt: string }> {
    if (!KNOWN_WORKER_IDS.has(input.instanceId)) {
      throw new DomainException(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ErrorCode.VALIDATION_FAILED,
        'La instancia no está en el registro de instancias esperadas',
        { reason: INSTANCE_UNKNOWN_REASON, instanceId: input.instanceId },
        INSTANCE_UNKNOWN_REASON,
      );
    }
    await this.heartbeats.save({ ...input, receivedAt: now });
    return {
      instanceId: input.instanceId,
      receivedAt: new Date(now).toISOString(),
    };
  }

  async liveness(): Promise<InstanceLivenessResponse> {
    const [heartbeats, probes] = await Promise.all([
      this.readHeartbeats(),
      this.probeDependencies(),
    ]);
    const now = Date.now();
    const context = {
      now,
      thresholds: this.env.thresholds,
      heartbeats,
      probes,
      apiStartedAt: this.apiStartedAt,
    };
    const instances = this.registry.map((definition) =>
      evaluateInstance(definition, context),
    );
    const { thresholds } = this.env;

    return {
      modelVersion: INSTANCE_LIVENESS_MODEL_VERSION,
      evaluatedAt: new Date(now).toISOString(),
      overall: overallOf(instances),
      summary: summarize(instances),
      heartbeatStore:
        heartbeats === null
          ? { status: 'down', reason: 'STORE_UNAVAILABLE' }
          : { status: 'up', reason: null },
      thresholds: {
        workerHeartbeatIntervalSeconds: Math.floor(
          thresholds.workerHeartbeatIntervalMs / 1000,
        ),
        degradedAfterSeconds: Math.floor(thresholds.degradedAfterMs / 1000),
        downAfterSeconds: Math.floor(thresholds.downAfterMs / 1000),
        dependencyLatencyDegradedMs: thresholds.dependencyLatencyDegradedMs,
        dependencyProbeTimeoutMs: thresholds.dependencyProbeTimeoutMs,
        clockToleranceSeconds: Math.floor(thresholds.clockToleranceMs / 1000),
      },
      instances,
      notMeasured: [...NOT_MEASURED],
    };
  }

  /** `null` si Redis no respondió: el dominio lo convierte en `STORE_UNAVAILABLE`. */
  private async readHeartbeats(): Promise<Record<string, string> | null> {
    try {
      return await this.heartbeats.readAll();
    } catch (error) {
      // Sólo la clase: el mensaje de ioredis puede traer host y puerto.
      this.logger.warn(
        `El almacén de latidos no respondió (${error instanceof Error ? error.name : 'desconocido'})`,
      );
      return null;
    }
  }

  /**
   * Sondas de `/readiness` con caché de 10 s y una sola corrida en vuelo:
   * varios admins mirando el tablero no multiplican consultas a las bases.
   * Si la corrida entera falla, no hay sondas y las dependencias quedan
   * `NOT_PROBED`; nunca se rellena con el resultado anterior vencido.
   */
  private async probeDependencies(): Promise<Record<string, ProbeOutcome>> {
    const now = Date.now();
    if (this.probeCache && now - this.probeCache.takenAt < PROBE_CACHE_TTL_MS) {
      return this.probeCache.probes;
    }
    if (!this.probePending) {
      this.probePending = this.runProbes().finally(() => {
        this.probePending = undefined;
      });
    }
    return this.probePending;
  }

  private async runProbes(): Promise<Record<string, ProbeOutcome>> {
    const takenAt = Date.now();
    let entries: Array<[string, DependencyStatus]>;
    try {
      entries = await this.readiness.collect();
    } catch (error) {
      this.logger.warn(
        `Las sondas de dependencias no pudieron ejecutarse (${error instanceof Error ? error.name : 'desconocido'})`,
      );
      return {};
    }
    const probes: Record<string, ProbeOutcome> = {};
    for (const [name, status] of entries) {
      if (!PROBED_DEPENDENCIES.includes(name)) continue;
      probes[name] = {
        status: status.status,
        latencyMs: status.latencyMs,
        ...(status.errorType ? { errorType: status.errorType } : {}),
      };
    }
    this.probeCache = { takenAt, probes };
    return probes;
  }
}
