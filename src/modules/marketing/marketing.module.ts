import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  MarketingController,
  TrackedLinkRedirectController,
  MarketingCollectionsController,
} from './controllers';
import {
  MarketingCampaignsService,
  MarketingJourneysService,
  MarketingCollectionsService,
} from './services';
import {
  MarketingCampaignsRepository,
  MarketingJourneysRepository,
} from './repositories';

/**
 * Módulo de marketing: segmentos, campañas multicanal, plantillas de contenido,
 * journeys con inscripciones, enlaces rastreables y atribución multi-touch
 * (UC-50-01 … 12).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    MarketingController,
    TrackedLinkRedirectController,
    MarketingCollectionsController,
  ],
  providers: [
    MarketingCollectionsService,
    MarketingCampaignsRepository,
    MarketingJourneysRepository,
    MarketingCampaignsService,
    MarketingJourneysService,
  ],
})
export class MarketingModule {}
