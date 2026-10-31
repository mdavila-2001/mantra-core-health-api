import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { DocumentStoreService } from '../../../document_store/services';
import { RedisRuntimeService } from '../../../redis_runtime/services';
import { SearchIndexService } from '../../../search_platform/services';
import {
  PROBE_TIMEOUT_MS,
  type ProbeResult,
} from '../../domain/instance-liveness';

/** Varios administradores consultando a la vez no multiplican las sondas. */
export const PROBE_CACHE_MS = 10_000;

type Probe = () => Promise<void>;

class ProbeTimeoutError extends Error {
  override readonly name = 'ProbeTimeoutError';
}

/**
 * Sondas activas de las dependencias de la API (`postgresql`, `mongodb`,
 * `redis`, `opensearch`). Mismo timeout que `/readiness` (3 s). Sólo prueban
 * que la dependencia contesta: son más ligeras que `/readiness`, que además
 * verifica integridad de esquema y seeds (y por eso lanza 503; aquí se
 * necesita el detalle como dato).
 *
 * Nunca lanza ni devuelve el mensaje de un error: sólo estado y latencia.
 */
@Injectable()
export class DependencyProbeService {
  private readonly logger = new Logger(DependencyProbeService.name);
  private cache: { at: number; results: Map<string, ProbeResult> } | null =
    null;
  private inFlight: Promise<Map<string, ProbeResult>> | null = null;

  constructor(
    private readonly em: EntityManager,
    private readonly documents: DocumentStoreService,
    private readonly redis: RedisRuntimeService,
    private readonly search: SearchIndexService,
  ) {}

  /** Resultados de las sondas, cacheados `PROBE_CACHE_MS`. */
  async probeAll(): Promise<Map<string, ProbeResult>> {
    const now = Date.now();
    if (this.cache && now - this.cache.at < PROBE_CACHE_MS) {
      return this.cache.results;
    }
    this.inFlight ??= this.runAll().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async runAll(): Promise<Map<string, ProbeResult>> {
    const probes: [string, Probe][] = [
      [
        'postgresql',
        async () => {
          await this.em.getConnection().execute('select 1');
        },
      ],
      ['mongodb', () => this.documents.ping()],
      ['redis', () => this.redis.ping()],
      ['opensearch', () => this.search.ping()],
    ];
    const entries = await Promise.all(
      probes.map(([id, probe]) => this.probe(id, probe)),
    );
    const results = new Map(entries);
    this.cache = { at: Date.now(), results };
    return results;
  }

  private async probe(
    id: string,
    operation: Probe,
  ): Promise<[string, ProbeResult]> {
    const startedAt = Date.now();
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new ProbeTimeoutError('timeout')),
            PROBE_TIMEOUT_MS,
          );
          timer.unref();
        }),
      ]);
      return [
        id,
        {
          status: 'up',
          latencyMs: Date.now() - startedAt,
          observedAtMs: startedAt,
        },
      ];
    } catch (error) {
      this.logger.warn(
        `Sonda de vida de ${id} falló (${error instanceof Error ? error.name : 'desconocido'})`,
      );
      return [
        id,
        {
          status: 'down',
          // Un timeout se reporta con el plazo completo aunque el reloj del
          // timer difiera 1 ms: la causa se decide por esta cifra.
          latencyMs:
            error instanceof ProbeTimeoutError
              ? PROBE_TIMEOUT_MS
              : Date.now() - startedAt,
          observedAtMs: startedAt,
        },
      ];
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
