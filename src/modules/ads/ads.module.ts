import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [AdsController],
  providers: [AdsService],
})
export class AdsModule {}
