import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const RECONCILIATION_INTERVAL_MS = 60_000;

/** Refleja `ReadModelHealthItemDto` (`modules/read_models/dto`). */
interface ReadModelHealthItem {
  definitionId: string;
  schemaName: string;
  objectName: string;
  lastRefreshedAt?: string | null;
  stalenessSeconds: number;
  stale: boolean;
}

/** Refleja `ReadModelHealthResponseDto`. */
interface ReadModelHealthResponse {
  generatedAt: string;
  items: ReadModelHealthItem[];
}

/** Refleja `RefreshRunResponseDto` (solo lo que este job usa). */
interface RefreshRunResponse {
  id: string;
  readModelDefinitionId: string;
  result: string;
}

/**
 * Fase 4 (P4) · UC-30-12/07: cierra el ciclo de reconciliación de read models
 * que `GET /read-models/health` deja pendiente. UC-30-12 ya calcula `stale`
 * por definición (staleness real vs `maximum_staleness_seconds`); lo único
 * que faltaba era alguien preguntando periódicamente y actuando sobre la
 * respuesta — exactamente el patrón de "descubre lote → actúa" de
 * `OutboxRelayJob`, pero aquí el descubrimiento ya existía (UC-30-12) y no
 * hizo falta añadir una consulta nueva.
 *
 * Sólo dispara `reconcile` (UC-30-07: recompute completo + `RM_RESULT_REPAIRED`),
 * nunca `invalidate` (UC-30-06): el propio servicio documenta `invalidate`
 * como la reacción a "cambio upstream" — un evento concreto de que una tabla
 * de origen cambió — no a un barrido de staleness ciego. Disparar
 * `invalidate` aquí duplicaría lo que `reconcile` ya hace para el caso que
 * este job cubre (staleness detectada) y lo haría también sobre definiciones
 * que no tienen ninguna razón conocida para recomputar.
 *
 * `reconcile` exige `object_type = MATERIALIZED_VIEW` (422 si no), pero
 * `ReadModelHealthItemDto` no distingue el tipo de objeto. Una definición
 * `VIEW` que reporte `stale` (declaró `maximumStalenessSeconds` sin ser una
 * MV) hará fallar su intento puntual de `reconcile`; `runTick` por ítem lo
 * registra y sigue con el siguiente, igual que el resto de jobs del proceso
 * no dejan que un ítem tumbe el lote entero.
 */
@Injectable()
export class ReadModelReconciliationJob {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ReadModelReconciliationJob.name);
  }

  @Interval(RECONCILIATION_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(
      this.logger,
      'worker.read_models.reconciliation',
      async () => {
        const health = await this.api.get<ReadModelHealthResponse>(
          '/read-models/health',
        );

        const staleItems = health.items.filter((item) => item.stale);
        if (staleItems.length === 0) return;

        this.logger.info(
          {
            operation: 'worker.read_models.reconciliation',
            staleCount: staleItems.length,
          },
          'Stale read models discovered',
        );

        for (const item of staleItems) {
          await runTick(this.logger, 'worker.read_models.reconciliation', () =>
            this.reconcileOne(item),
          );
        }
      },
    );
  }

  private async reconcileOne(item: ReadModelHealthItem): Promise<void> {
    const result = await this.api.post<RefreshRunResponse>(
      `/read-models/${item.definitionId}/reconcile`,
    );

    this.logger.info(
      {
        operation: 'worker.read_models.reconciliation',
        definitionId: item.definitionId,
        schemaName: item.schemaName,
        objectName: item.objectName,
        result: result.result,
      },
      'Read model reconciled',
    );
  }
}
