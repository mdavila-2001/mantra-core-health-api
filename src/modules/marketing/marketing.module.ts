import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  InsightsFactsController,
  MarketingController,
  TrackedLinkRedirectController,
} from './controllers';
import {
  InsightsFactsService,
  MarketingCampaignsService,
  MarketingJourneysService,
} from './services';
import {
  InsightsFactsRepository,
  MarketingCampaignsRepository,
  MarketingJourneysRepository,
} from './repositories';

/**
 * Módulo de marketing: segmentos, campañas multicanal, plantillas de contenido,
 * journeys con inscripciones, enlaces rastreables y atribución multi-touch
 * (UC-50-01 … 12) y las lecturas de AloVida Insights (UC-50-13 … 14).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    MarketingController,
    TrackedLinkRedirectController,
    InsightsFactsController,
  ],
  providers: [
    MarketingCampaignsRepository,
    MarketingJourneysRepository,
    InsightsFactsRepository,
    MarketingCampaignsService,
    MarketingJourneysService,
    InsightsFactsService,
  ],
})
export class MarketingModule {}
