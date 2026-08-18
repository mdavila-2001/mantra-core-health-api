import { Module } from '@nestjs/common';
import { FeedFanoutJob } from './feed-fanout.job';
import { SearchIndexerJob } from './search-indexer.job';

export { FeedFanoutJob } from './feed-fanout.job';
export { SearchIndexerJob } from './search-indexer.job';

/**
 * Worker del módulo Community (19):
 *
 *  - el fan-out del feed social (`GET /internal/community/feed/pending` →
 *    `POST …/rebuild` por publicación);
 *  - el indexador del directorio público (P10), que mantiene OpenSearch al día
 *    con `community.public_profiles`.
 *
 * Los demás barridos que el módulo va a necesitar —recálculo de
 * `rank_score`, reconciliación de contadores contra Redis, prestigio y
 * vencimiento de la cola de moderación— entran acá como jobs nuevos, no
 * como ramas de éste.
 */
@Module({
  providers: [FeedFanoutJob, SearchIndexerJob],
})
export class CommunityWorkerModule {}
