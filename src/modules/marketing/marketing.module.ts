import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  InsightsFactsController,
  InsightsWorkflowController,
  InsightsWorkspaceController,
  MarketingController,
  TrackedLinkRedirectController,
} from './controllers';
import {
  InsightsFactsService,
  InsightsWorkflowService,
  InsightsWorkspaceService,
  MarketingCampaignsService,
  MarketingJourneysService,
} from './services';
import {
  InsightsFactsRepository,
  InsightsWorkflowRepository,
  InsightsWorkspaceRepository,
  MarketingCampaignsRepository,
  MarketingJourneysRepository,
} from './repositories';

/**
 * Módulo de marketing: segmentos, campañas multicanal, plantillas de contenido,
 * journeys con inscripciones, enlaces rastreables y atribución multi-touch
 * (UC-50-01 … 12) y las lecturas (UC-50-13 … 14) y el flujo de trabajo de AloVida Insights (UC-50-15 … 18).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [
    MarketingController,
    TrackedLinkRedirectController,
    InsightsFactsController,
    InsightsWorkflowController,
    InsightsWorkspaceController,
  ],
  providers: [
    MarketingCampaignsRepository,
    MarketingJourneysRepository,
    InsightsFactsRepository,
    InsightsWorkflowRepository,
    InsightsWorkspaceRepository,
    MarketingCampaignsService,
    MarketingJourneysService,
    InsightsFactsService,
    InsightsWorkflowService,
    InsightsWorkspaceService,
  ],
})
export class MarketingModule {}
