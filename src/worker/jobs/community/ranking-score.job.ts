import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PinoLogger } from 'nestjs-pino';
import { SystemApiClient } from '../../system-api-client.service';
import { runTick } from '../../run-tick.util';

const RANKING_INTERVAL_MS = 120_000;

/** Peso del término de recencia en el puntaje final. */
const WEIGHT_RECENCY = 0.6;
/** Peso del término de interacción (reacciones + comentarios). */
const WEIGHT_INTERACTION = 0.35;
/** Peso del término de afinidad seguidor↔autor. */
const WEIGHT_AFFINITY = 0.05;

/**
 * Vida media de la recencia, en horas: a esta antigüedad el término de
 * recencia vale la mitad que a antigüedad cero. Decaimiento exponencial y no
 * lineal a propósito — un post de una hora y uno de dos horas deben distinguirse
 * más que uno de treinta días y uno de treinta y uno.
 */
const RECENCY_HALF_LIFE_HOURS = 24;

/**
 * Cuánto vale un comentario frente a una reacción en el término de
 * interacción. Comentar cuesta más que reaccionar, así que pesa más.
 */
const COMMENT_INTERACTION_MULTIPLIER = 2;

/** Refleja `FeedRankingPendingItemDto` (`modules/community/dto`). */
interface FeedRankingPendingItem {
  feedItemId: string;
  postId: string;
  ownerProfileId: string;
  authorProfileId: string;
  itemCreatedAt: string;
  postPublishedAt: string | null;
  reactionCount: number;
  commentCount: number;
}

/** Refleja `FeedRankingPendingResponseDto`. */
interface FeedRankingPendingResponse {
  items: FeedRankingPendingItem[];
}

/** Refleja `FeedRankingApplyResponseDto`. */
interface FeedRankingApplyResponse {
  updated: number;
}

/**
 * Recencia con decaimiento exponencial: 1 en el instante de publicación, 0.5
 * a `RECENCY_HALF_LIFE_HOURS`, y así sucesivamente. Un post sin
 * `postPublishedAt` (fuente borrada o nunca publicada) no aporta recencia.
 */
function recencyTerm(postPublishedAt: string | null, nowMs: number): number {
  if (!postPublishedAt) return 0;
  const publishedMs = Date.parse(postPublishedAt);
  if (Number.isNaN(publishedMs)) return 0;
  const ageHours = Math.max(0, (nowMs - publishedMs) / 3_600_000);
  return Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
}

/**
 * Interacción del post, en escala logarítmica: un post con cero interacción
 * vale 0, y cada orden de magnitud de reacciones+comentarios aporta un punto
 * entero — así un post viral no ahoga por escala al resto del término.
 */
function interactionTerm(reactionCount: number, commentCount: number): number {
  const weighted =
    reactionCount + commentCount * COMMENT_INTERACTION_MULTIPLIER;
  return Math.log10(1 + Math.max(0, weighted));
}

/**
 * Afinidad entre el dueño del ítem (el lector) y el autor de la publicación.
 *
 * No hay una señal de interacción histórica entre dos perfiles (mensajes
 * cruzados, reacciones repetidas, etc.) de la que derivar esto, así que el
 * término vale siempre 0 y el ranking depende sólo de recencia e interacción
 * del post. Es una función con su propio peso (`WEIGHT_AFFINITY`): sumar una
 * señal es cambiar esta función, no la fórmula.
 */
function affinityTerm(_item: FeedRankingPendingItem): number {
  return 0;
}

/** Calcula el `rank_score` de un ítem, formateado como texto decimal. */
function computeRankScore(item: FeedRankingPendingItem, nowMs: number): string {
  const score =
    WEIGHT_RECENCY * recencyTerm(item.postPublishedAt, nowMs) +
    WEIGHT_INTERACTION *
      interactionTerm(item.reactionCount, item.commentCount) +
    WEIGHT_AFFINITY * affinityTerm(item);
  return score.toFixed(6);
}

/**
 * Recalcula `feed_items.rank_score` (UC-19-16).
 *
 * `feed_items` nacía con el `rank_score` que tenía en el momento del fan-out
 * (`FeedRepository.create` lo fija en `0` si nadie lo pasa) y nunca se
 * actualizaba: un post publicado hace una semana con cien reacciones nuevas
 * seguía puntuando lo mismo que el día que se repartió. Este job cierra ese
 * circuito recorriendo el feed entero en rotación — ver el comentario de
 * `FeedRepository.listPageForRanking` para cómo rota sin cursor propio — y
 * reescribiendo el puntaje con la fórmula de arriba.
 *
 * La fórmula vive acá y no en `modules/community` a propósito: los pesos son
 * una decisión de producto que cambia con más frecuencia que el contrato
 * HTTP, y ajustarlos no debería tocar el módulo de negocio.
 */
@Injectable()
export class RankingScoreJob {
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
    this.logger.setContext(RankingScoreJob.name);
  }

  /** Descubre el lote pendiente, puntúa cada ítem y aplica el resultado. */
  @Interval(RANKING_INTERVAL_MS)
  async tick(): Promise<void> {
    await runTick(this.logger, 'worker.community.ranking_score', async () => {
      const pending = await this.api.get<FeedRankingPendingResponse>(
        '/internal/community/feed/ranking/pending',
      );

      if (pending.items.length === 0) return;

      const nowMs = Date.now();
      const updates = pending.items.map((item) => ({
        feedItemId: item.feedItemId,
        rankScore: computeRankScore(item, nowMs),
      }));

      const result = await this.api.post<FeedRankingApplyResponse>(
        '/internal/community/feed/ranking/apply',
        { updates },
      );

      this.logger.info(
        {
          operation: 'worker.community.ranking_score',
          pendingCount: pending.items.length,
          updated: result.updated,
        },
        'Feed rank_score recalculated',
      );
    });
  }
}
