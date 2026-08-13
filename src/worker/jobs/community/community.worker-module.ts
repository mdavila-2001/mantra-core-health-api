import { Module } from '@nestjs/common';
import { FeedFanoutJob } from './feed-fanout.job';

export { FeedFanoutJob } from './feed-fanout.job';

/**
 * Worker del módulo Community (19): hoy, el fan-out del feed social
 * (`GET /internal/community/feed/pending` → `POST …/rebuild` por publicación).
 *
 * Los demás barridos que el módulo va a necesitar —recálculo de
 * `rank_score`, reconciliación de contadores contra Redis, prestigio y
 * vencimiento de la cola de moderación— entran acá como jobs nuevos, no
 * como ramas de éste.
 */
@Module({
  providers: [FeedFanoutJob],
})
export class CommunityWorkerModule {}
