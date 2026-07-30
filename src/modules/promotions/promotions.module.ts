import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { LoyaltyController, PromotionsController } from './controllers';
import {
  PromotionsLoyaltyService,
  PromotionsDiscountsService,
} from './services';
import {
  PromotionsLoyaltyRepository,
  PromotionsDiscountsRepository,
} from './repositories';

/**
 * Módulo de promociones: programas de lealtad con niveles y ledger de puntos,
 * promociones con reglas de descuento, cupones, redenciones y referidos
 * (UC-51-01 … 13).
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [LoyaltyController, PromotionsController],
  providers: [
    PromotionsLoyaltyRepository,
    PromotionsDiscountsRepository,
    PromotionsLoyaltyService,
    PromotionsDiscountsService,
  ],
})
export class PromotionsModule {}
