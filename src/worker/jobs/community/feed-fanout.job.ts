import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const FANOUT_INTERVAL_MS = 60_000;

/** Refleja `FeedPendingItemDto` (`modules/community/dto`). */
interface FeedPendingItem {
  postId: string;
  authorProfileId: string;
  followerProfileIds: string[];
}

/** Refleja `FeedPendingResponseDto`. */
interface FeedPendingResponse {
  items: FeedPendingItem[];
}

/** Refleja `FeedRebuildResponseDto`. */
interface FeedRebuildResponse {
  itemsCreated: number;
}

/**
 * Fan-out del feed social (UC-19-15).
 *
 * `POST /internal/community/feed/rebuild` existía desde que nació el módulo y
 * el README lo declaraba «worker interno», pero no había worker: era un
 * endpoint que nadie llamaba, así que `feed_items` sólo se poblaba si alguien
 * lo disparaba a mano. Este job cierra ese circuito con el mismo patrón
 * «descubre lote → actúa por ítem» de `ReadModelReconciliationJob`.
 *
 * El reparto es idempotente en el servidor (`rebuild` no duplica el item por
 * dueño y fuente), así que un tick que se solape con el anterior o un
 * reintento tras un fallo parcial no ensucian nada.
 *
 * **Lo que este job todavía no hace**: el reparto es siempre *push*, sin el
 * umbral híbrido push/pull que el plan del módulo prevé para autores con
 * muchísimos seguidores. El tope por post acota el daño mientras tanto; el
 * umbral es una decisión abierta del equipo, no un olvido.
 */
@Injectable()
export class FeedFanoutJob {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param api - Cliente HTTP autenticado como `SYSTEM` contra la propia API.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FeedFanoutJob.name);
  }

  /** Descubre el lote pendiente y reparte cada publicación. */
  @Interval(FANOUT_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.community.feed_fanout', async () => {
      const pending = await this.api.get<FeedPendingResponse>(
        '/internal/community/feed/pending',
      );

      if (pending.items.length === 0) return;

      this.logger.info(
        {
          operation: 'worker.community.feed_fanout',
          pendingCount: pending.items.length,
        },
        'Posts pending fan-out discovered',
      );

      for (const item of pending.items) {
        await runTick(this.logger, 'worker.community.feed_fanout', () =>
          this.fanOutOne(item),
        );
      }
    });
  }

  /** Reparte una publicación a los feeds de sus seguidores. */
  private async fanOutOne(item: FeedPendingItem): Promise<void> {
    const result = await this.api.post<FeedRebuildResponse>(
      '/internal/community/feed/rebuild',
      {
        sourceRefId: item.postId,
        followerProfileIds: item.followerProfileIds,
        origin: 'FOLLOWING',
      },
    );

    this.logger.info(
      {
        operation: 'worker.community.feed_fanout',
        postId: item.postId,
        authorProfileId: item.authorProfileId,
        followers: item.followerProfileIds.length,
        itemsCreated: result.itemsCreated,
      },
      'Post fanned out',
    );
  }
}
