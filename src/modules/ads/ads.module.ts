import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { AdsController } from './controllers';
import {
  AdsAccountsService,
  AdsCampaignsService,
  AdsDataService,
  AdsOptimizationService,
} from './services';
import {
  AdsAccountsRepository,
  AdsCampaignsRepository,
  AdsDataRepository,
  AdsOptimizationRepository,
  AdsInsightsConfigRepository,
} from './repositories';

/**
 * Módulo de publicidad: estructura de cuentas y socios, conexión con la
 * plataforma, jerarquía de campaña, política de datos de evento, ingesta de
 * entrega, conversiones, catálogo, experimentos, reglas, moderación,
 * facturación y captura de leads (UC-43-01 … 16).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AdsController],
  providers: [
    AdsAccountsRepository,
    AdsCampaignsRepository,
    AdsDataRepository,
    AdsOptimizationRepository,
    AdsInsightsConfigRepository,
    AdsAccountsService,
    AdsCampaignsService,
    AdsDataService,
    AdsOptimizationService,
  ],
})
export class AdsModule {}
