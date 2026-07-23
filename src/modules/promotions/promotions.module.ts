import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
