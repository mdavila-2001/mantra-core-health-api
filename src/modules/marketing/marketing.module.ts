import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import * as entities from './entities';

@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [MarketingController],
  providers: [MarketingService],
})
export class MarketingModule {}
