import { Module } from '@nestjs/common';
import { FeedFanoutJob } from './feed-fanout.job';
import { SearchIndexerJob } from './search-indexer.job';
import { BadgeExpiryJob } from './badge-expiry.job';
import { RankingScoreJob } from './ranking-score.job';

export { FeedFanoutJob } from './feed-fanout.job';
export { SearchIndexerJob } from './search-indexer.job';
export { BadgeExpiryJob } from './badge-expiry.job';
export { RankingScoreJob } from './ranking-score.job';

/**
 * Worker del módulo Community (19):
 *
 *  - el fan-out del feed social (`GET /internal/community/feed/pending` →
 *    `POST …/rebuild` por publicación);
 *  - el recálculo periódico de `rank_score` del feed (`RankingScoreJob`,
 *    UC-19-16: `GET …/feed/ranking/pending` → `POST …/feed/ranking/apply`);
 *  - el indexador del directorio público (P10), que mantiene OpenSearch al día
 *    con `community.public_profiles`;
 *  - el barrido de sellos vencidos (P13), que es lo que hace que «Verificado»
 *    caiga por el reloj y no sólo por un evento.
 *
 * Los demás barridos que el módulo todavía necesita —reconciliación de
 * contadores contra Redis, prestigio y vencimiento de la cola de
 * moderación— entran acá como jobs nuevos, no como ramas de éstos.
 */
@Module({
  providers: [FeedFanoutJob, SearchIndexerJob, BadgeExpiryJob, RankingScoreJob],
})
export class CommunityWorkerModule {}
